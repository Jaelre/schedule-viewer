#!/usr/bin/env python3
"""Extract MetricAid doctors and shifts into a local DuckDB database.

The script intentionally keeps the upstream response in ``raw_api_responses``
and publishes two query-friendly tables:

* ``doctors``: one row per assigned doctor
* ``shifts``: one row per upstream schedule record

By default the current calendar month is loaded. Re-running an extraction
replaces the selected date range, so the result is deterministic and does not
silently accumulate duplicates.
"""

from __future__ import annotations

import argparse
import calendar
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import duckdb


DEFAULT_API_BASE_URL = 'https://api.metricaid.com'
DEFAULT_DATABASE = Path('schedule.duckdb')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    range_group = parser.add_mutually_exclusive_group()
    range_group.add_argument(
        '--month',
        help='Month to extract in YYYY-MM format (default: current month)',
    )
    range_group.add_argument(
        '--start-date',
        help='First date to extract in YYYY-MM-DD format; requires --end-date',
    )
    parser.add_argument(
        '--end-date',
        help='Last date to extract in YYYY-MM-DD format; requires --start-date',
    )
    parser.add_argument(
        '--database',
        type=Path,
        default=DEFAULT_DATABASE,
        help=f'Local DuckDB path (default: {DEFAULT_DATABASE})',
    )
    parser.add_argument(
        '--api-base-url',
        default=os.environ.get('API_BASE_URL', DEFAULT_API_BASE_URL),
        help='MetricAid API origin (default: API_BASE_URL or api.metricaid.com)',
    )
    parser.add_argument(
        '--api-token',
        default=os.environ.get('API_TOKEN'),
        help='MetricAid API token (default: API_TOKEN environment variable)',
    )
    args = parser.parse_args()

    if (args.start_date is None) != (args.end_date is None):
        parser.error('--start-date and --end-date must be supplied together')

    if args.month and args.end_date:
        parser.error('--month cannot be combined with --end-date')

    if not args.api_token:
        parser.error('API_TOKEN is required; set it in the environment or pass --api-token')

    args.start_date, args.end_date = resolve_date_range(
        args.month,
        args.start_date,
        args.end_date,
    )
    return args


def resolve_date_range(
    month: str | None,
    start_date: str | None,
    end_date: str | None,
) -> tuple[str, str]:
    if start_date and end_date:
        start = parse_date(start_date, '--start-date')
        end = parse_date(end_date, '--end-date')
    else:
        selected_month = month or datetime.now().strftime('%Y-%m')
        try:
            year, month_number = (int(part) for part in selected_month.split('-'))
            if len(selected_month) != 7 or selected_month[4] != '-':
                raise ValueError
            start = date(year, month_number, 1)
            end = date(year, month_number, calendar.monthrange(year, month_number)[1])
        except (TypeError, ValueError):
            raise SystemExit(f'Invalid month: {selected_month!r}; expected YYYY-MM')

    if end < start:
        raise SystemExit('--end-date must be on or after --start-date')
    return start.isoformat(), end.isoformat()


def parse_date(value: str, argument_name: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise SystemExit(f'Invalid {argument_name}: {value!r}; expected YYYY-MM-DD') from error


def load_env_file(path: Path) -> None:
    """Load simple KEY=VALUE entries without requiring python-dotenv."""
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def fetch_schedule(
    api_base_url: str,
    api_token: str,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    query = urllib.parse.urlencode(
        {
            'token': api_token,
            'startDate': start_date,
            'endDate': end_date,
            'scheduleVersion': 'live',
        }
    )
    url = f'{api_base_url.rstrip("/")}/public/schedule?{query}'
    request = urllib.request.Request(url, headers={'Accept': 'application/json'})

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read()
    except Exception as error:
        raise RuntimeError(
            f'Failed to fetch MetricAid schedule for {start_date}..{end_date}: {error}'
        ) from error

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as error:
        raise RuntimeError(f'MetricAid returned invalid JSON: {error}') from error

    if not isinstance(payload, dict):
        raise RuntimeError('MetricAid response must be a JSON object')
    if payload.get('error') is True:
        status = payload.get('status')
        raise RuntimeError(f'MetricAid reported an error: {status!r}')
    records = payload.get('data')
    if not isinstance(records, list):
        raise RuntimeError("MetricAid response is missing a list-valued 'data' field")
    return payload


def text_value(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def doctor_name(user: dict[str, Any]) -> str | None:
    parts = [text_value(user.get(field)) for field in ('fname', 'mname', 'lname')]
    parts = [part for part in parts if part]
    return ' '.join(parts) or None


def parse_timestamp(value: Any) -> datetime | None:
    timestamp = text_value(value)
    if not timestamp:
        return None
    try:
        parsed = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError as error:
        raise RuntimeError(f'Invalid upstream timestamp: {timestamp!r}') from error
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def parse_shift_date(record: dict[str, Any]) -> date:
    value = text_value(record.get('date'))
    if not value:
        timestamp = parse_timestamp(record.get('start_time'))
        if timestamp is None:
            raise RuntimeError('Shift record has neither date nor start_time')
        return timestamp.date()
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise RuntimeError(f'Invalid upstream shift date: {value!r}') from error


def as_int(value: Any) -> int | None:
    if value is None or value == '':
        return None
    try:
        return int(value)
    except (TypeError, ValueError) as error:
        raise RuntimeError(f'Expected an integer upstream value, got {value!r}') from error


def create_schema(connection: duckdb.DuckDBPyConnection) -> None:
    connection.sql(
        '''
        CREATE TABLE IF NOT EXISTS raw_api_responses (
            fetched_at TIMESTAMP NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            payload JSON NOT NULL
        )
        '''
    )
    connection.sql(
        '''
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id VARCHAR NOT NULL,
            first_name VARCHAR,
            middle_name VARCHAR,
            last_name VARCHAR,
            doctor_name VARCHAR NOT NULL,
            source_user JSON NOT NULL,
            PRIMARY KEY (doctor_id)
        )
        '''
    )
    connection.sql(
        '''
        CREATE TABLE IF NOT EXISTS shifts (
            slot_id BIGINT,
            shift_date DATE NOT NULL,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            doctor_id VARCHAR,
            shift_id BIGINT,
            shift_name VARCHAR,
            shift_alias VARCHAR,
            shift_color VARCHAR,
            shift_type INTEGER,
            is_on_call BOOLEAN,
            is_weekend BOOLEAN,
            site_id BIGINT,
            site_name VARCHAR,
            site_short_name VARCHAR,
            site_timezone VARCHAR,
            source_row_number INTEGER NOT NULL,
            source_record JSON NOT NULL
        )
        '''
    )


def replace_range(
    connection: duckdb.DuckDBPyConnection,
    payload: dict[str, Any],
    start_date: str,
    end_date: str,
) -> tuple[int, int]:
    records = payload['data']
    fetched_at = datetime.now(timezone.utc).replace(tzinfo=None)
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    doctors: dict[str, tuple[Any, ...]] = {}
    shifts: list[tuple[Any, ...]] = []
    for row_number, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            raise RuntimeError(f'Shift record {row_number} is not a JSON object')
        user = record.get('user') or {}
        shift = record.get('shift') or {}
        site = record.get('site') or {}
        if not isinstance(user, dict) or not isinstance(shift, dict) or not isinstance(site, dict):
            raise RuntimeError(f'Shift record {row_number} has an invalid nested object')

        shift_day = parse_shift_date(record)
        if shift_day < start or shift_day > end:
            raise RuntimeError(
                f'Shift record {row_number} date {shift_day} falls outside requested range '
                f'{start_date}..{end_date}'
            )

        doctor_id = text_value(user.get('id'))
        name = doctor_name(user)
        if doctor_id and name:
            doctors[doctor_id] = (
                doctor_id,
                text_value(user.get('fname')),
                text_value(user.get('mname')),
                text_value(user.get('lname')),
                name,
                json.dumps(user, separators=(',', ':')),
            )

        shifts.append(
            (
                as_int(record.get('slot_id')),
                shift_day,
                parse_timestamp(record.get('start_time')),
                parse_timestamp(record.get('end_time')),
                doctor_id,
                as_int(shift.get('id')),
                text_value(shift.get('name')),
                text_value(shift.get('alias')),
                text_value(shift.get('color')),
                as_int(shift.get('type')),
                record.get('is_on_call'),
                record.get('is_weekend'),
                as_int(site.get('id')),
                text_value(site.get('name')),
                text_value(site.get('short_name')),
                text_value((site.get('timezone') or {}).get('name'))
                if isinstance(site.get('timezone') or {}, dict)
                else None,
                row_number,
                json.dumps(record, separators=(',', ':')),
            )
        )

    connection.execute('BEGIN TRANSACTION')
    try:
        connection.execute(
            'DELETE FROM raw_api_responses WHERE start_date = ? AND end_date = ?',
            [start, end],
        )
        connection.execute(
            'DELETE FROM shifts WHERE shift_date BETWEEN ? AND ?',
            [start, end],
        )
        connection.execute(
            '''
            DELETE FROM doctors
            WHERE doctor_id NOT IN (SELECT DISTINCT doctor_id FROM shifts WHERE doctor_id IS NOT NULL)
            ''',
        )
        connection.execute(
            'INSERT INTO raw_api_responses VALUES (?, ?, ?, ?)',
            [fetched_at, start, end, json.dumps(payload, separators=(',', ':'))],
        )
        if shifts:
            connection.executemany(
                '''
                INSERT INTO shifts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                shifts,
            )
        if doctors:
            connection.executemany(
                '''
                INSERT INTO doctors VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (doctor_id) DO UPDATE SET
                    first_name = excluded.first_name,
                    middle_name = excluded.middle_name,
                    last_name = excluded.last_name,
                    doctor_name = excluded.doctor_name,
                    source_user = excluded.source_user
                ''',
                list(doctors.values()),
            )
        connection.execute('COMMIT')
    except Exception:
        connection.execute('ROLLBACK')
        raise

    return len(doctors), len(shifts)


def main() -> int:
    # worker/.dev.vars is the repository's documented local secret source.
    load_env_file(Path('worker/.dev.vars'))
    args = parse_args()

    args.database.parent.mkdir(parents=True, exist_ok=True)
    payload = fetch_schedule(
        args.api_base_url,
        args.api_token,
        args.start_date,
        args.end_date,
    )

    with duckdb.connect(str(args.database)) as connection:
        create_schema(connection)
        doctor_count, shift_count = replace_range(
            connection,
            payload,
            args.start_date,
            args.end_date,
        )

    print(
        f'Loaded {doctor_count} doctors and {shift_count} shifts '
        f'for {args.start_date}..{args.end_date} into {args.database}'
    )
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f'error: {error}', file=sys.stderr)
        raise SystemExit(1) from error
