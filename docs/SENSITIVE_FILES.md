# Sensitive Files Setup

This project requires certain files containing sensitive information (staff names, private documents) that are not committed to the repository.

## Required Files

### 1. Doctor Names Dictionary

**File**: `src/lib/doctor-names.json`

Copy the example file and populate with actual staff names:

```bash
cp src/lib/doctor-names.json.example src/lib/doctor-names.json
```

Then edit `src/lib/doctor-names.json` to add the real staff roster.

**Important**: Use the exact pseudonyms/IDs that the API returns as the keys!

Format:

```json
{
  "comment": "Dictionary mapping API pseudonyms to real names.",
  "names": {
    "API_PSEUDONYM_OR_ID": "REAL NAME",
    "467": "FIRSTNAME Lastname",
    "Rossi": "MARIO Rossi",
    "Mario Rossi": "MARIO Rossi"
  }
}
```

**How to find the API pseudonyms:**
1. Load the app in the browser
2. Open developer console (F12)
3. Look at the network request to `/api/shifts`
4. Check the response JSON to see what names/IDs are in `people[].id` and `people[].name`
5. Use those exact values as keys in your `doctor-names.json`

**Matching Strategy:**
The app will try multiple matching approaches:
1. Direct key lookup (fastest - use API pseudonym as key)
2. Case-insensitive key lookup
3. Last name matching
4. Substring matching
5. Falls back to displaying API name if no match

### 2. Private Documentation

**Directory**: `docs/private/`

This directory contains sensitive documents (staff lists, screenshots, etc.) and is excluded from version control.

Create the directory if needed:

```bash
mkdir -p docs/private
```

## Gitignored Files

The following files and directories are automatically ignored by git:

- `docs/private/` - Private documentation and sensitive files
- `src/lib/doctor-names.json` - Staff roster with real names
- `*.xlsx`, `*.xls`, `*.csv` - Spreadsheet files that may contain sensitive data
- `**/sensitive/`, `**/confidential/` - Any directories marked as sensitive

## Security Notes

- **Never commit real staff names** to the public repository
- **Use the .example files** as templates for configuration
- **Keep backups** of your `doctor-names.json` file separately from the git repository
- **Verify .gitignore** is working before committing any changes

## Verification

To verify that sensitive files are properly ignored:

```bash
git status --ignored
```

The command should show ignored files in the output.
