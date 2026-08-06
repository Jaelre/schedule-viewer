# Local DuckDB schedule extract

Use `scripts/extract_schedule_to_duckdb.py` to fetch schedule records from the
MetricAid API and load them into `schedule.duckdb`.

The script reads `API_TOKEN` from `worker/.dev.vars` (or the environment),
defaults to the current calendar month, and fails if the upstream response is
not valid or contains records outside the requested range.

```sh
python3 scripts/extract_schedule_to_duckdb.py
python3 scripts/extract_schedule_to_duckdb.py --month 2026-07
python3 scripts/extract_schedule_to_duckdb.py \
  --start-date 2026-07-01 \
  --end-date 2026-07-31 \
  --database data/schedule.duckdb
```

The database contains:

* `raw_api_responses` – the exact JSON response for each loaded date range;
* `doctors` – one row per assigned doctor;
* `shifts` – one row per API schedule record, including the source JSON.

Inspect the result with:

```sh
duckdb schedule.duckdb \
  "SELECT doctor_id, doctor_name, COUNT(shifts.slot_id) AS shifts FROM doctors LEFT JOIN shifts USING (doctor_id) GROUP BY ALL ORDER BY doctor_name;"
```
