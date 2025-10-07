# Sensitive Files Setup

This project requires certain files containing sensitive information (staff names, private documents) that are not committed to the repository.

## Required Files

### 1. Doctor Names Dictionary

**File**: `src/lib/doctor-names.json`

Copy the example file and populate with actual staff names:

```bash
cp src/lib/doctor-names.json.example src/lib/doctor-names.json
```

Then edit `src/lib/doctor-names.json` to add the real staff roster. Format:

```json
{
  "comment": "Dictionary mapping doctor IDs to real names.",
  "names": {
    "1": "FIRSTNAME Lastname",
    "2": "FIRSTNAME Lastname",
    ...
  }
}
```

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
