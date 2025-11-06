# Git-Crypt Setup Guide

This repository uses [git-crypt](https://github.com/AGWA/git-crypt) to automatically encrypt sensitive files before they are committed to the repository.

## Overview

Git-crypt enables transparent encryption and decryption of files in a git repository. Files which you choose will be encrypted when committed, and decrypted when checked out.

## Encrypted Files

The following files and patterns are automatically encrypted (see `.gitattributes`):

### Environment Files
- `.env`, `.env.local`, `.env.development`, `.env.production`, etc.
- `worker/.dev.vars`, `worker/wrangler-local.toml`

### Sensitive Configuration
- `src/config/doctor-names.json`
- `src/config/shift-colors.json`
- `src/config/shift-styling.config.json`
- `src/config/shift-display.config.json`

### Private Documentation
- `docs/private/**`

### Sensitive Directories
- `**/sensitive/**`
- `**/confidential/**`

### Data Files
- `*.xlsx`, `*.xls`, `*.csv`

### Scripts
- `scripts/update_siamo_numeri.py`

## Installation

### 1. Install git-crypt

**On Ubuntu/Debian:**
```bash
sudo apt install git-crypt
```

**From source (if binary incompatible):**
```bash
cd /tmp
git clone https://github.com/AGWA/git-crypt.git
cd git-crypt
make
cp git-crypt ~/.local/bin/
```

### 2. Unlock the Repository

The encryption key is stored at `~/.config/schedule-viewer/git-crypt-key`.

To unlock the repository and decrypt files:
```bash
git-crypt unlock ~/.config/schedule-viewer/git-crypt-key
```

**Note:** You need to do this once per clone of the repository.

## Daily Workflow

Once unlocked, git-crypt works transparently:

1. **Making changes:** Edit encrypted files normally - they appear decrypted in your working directory
2. **Committing:** Files are automatically encrypted when committed
3. **Pulling/Pushing:** Files are automatically decrypted after pull, encrypted before push

## Common Operations

### Check Encryption Status
```bash
git-crypt status
```
Shows which files are encrypted and which are not.

### Lock the Repository
```bash
git-crypt lock
```
Encrypts all files in the working directory (requires clean working tree).

### Unlock the Repository
```bash
git-crypt unlock ~/.config/schedule-viewer/git-crypt-key
```
Decrypts all files in the working directory.

### Export the Key (Already Done)
```bash
git-crypt export-key ~/.config/schedule-viewer/git-crypt-key
chmod 600 ~/.config/schedule-viewer/git-crypt-key
```

## Key Management

### Key Location
The symmetric encryption key is stored at:
```
~/.config/schedule-viewer/git-crypt-key
```

**Security Notes:**
- This key has permissions 600 (readable only by you)
- Never commit this key to the repository
- Back up this key securely - without it, encrypted files cannot be decrypted
- Share this key securely with collaborators who need access to sensitive files

### Sharing Access with Collaborators

To give a collaborator access:

1. Securely transfer the key file to them (use encrypted channel, never plain email)
2. They should save it to `~/.config/schedule-viewer/git-crypt-key`
3. They should set correct permissions: `chmod 600 ~/.config/schedule-viewer/git-crypt-key`
4. They should unlock their clone: `git-crypt unlock ~/.config/schedule-viewer/git-crypt-key`

## Troubleshooting

### Files Not Encrypting
1. Check `.gitattributes` contains the correct pattern
2. Run `git-crypt status` to verify configuration
3. For previously committed files, run `git-crypt status -f` to re-encrypt

### "not encrypted" Warnings
If you see warnings about staged/committed versions not being encrypted:
```bash
git-crypt status -f
git add .gitattributes
git commit -m "Re-encrypt sensitive files"
```

### Cannot Read Encrypted Files
Make sure the repository is unlocked:
```bash
git-crypt unlock ~/.config/schedule-viewer/git-crypt-key
```

### Clone Shows Binary Files
Fresh clones will show encrypted files as binary until unlocked:
```bash
cd /path/to/new/clone
git-crypt unlock ~/.config/schedule-viewer/git-crypt-key
```

## Technical Details

### How It Works
- Git-crypt uses git's clean/smudge filters
- When files match patterns in `.gitattributes`, they are:
  - **Encrypted** (clean filter) before being stored in git
  - **Decrypted** (smudge filter) when checked out to working directory

### Encryption Algorithm
- AES-256 symmetric encryption
- HMAC-SHA1 for authentication
- Single symmetric key (not GPG-based)

## References

- [git-crypt GitHub Repository](https://github.com/AGWA/git-crypt)
- [git-crypt Documentation](https://github.com/AGWA/git-crypt/blob/master/README.md)
