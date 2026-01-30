# File Operations Prompt

## Overview

This document provides guidelines for using `file_get` and `file_put` tools correctly to avoid common failures.

## Critical Rule: Always Use Absolute Paths

**The #1 cause of file operation failures is using relative paths.**

### ✅ CORRECT Examples
```
file_get("/home/runner/work/Meowstik/Meowstik/src/App.tsx")
file_put("/home/runner/work/Meowstik/Meowstik/config.json", content)
file_get("/var/log/app.log")
```

### ❌ INCORRECT Examples
```
file_get("src/App.tsx")                    # Missing absolute path
file_put("./config.json", content)         # Relative path
file_get("~/documents/file.txt")           # Tilde not expanded
```

## Why Absolute Paths Are Required

1. **Context Independence**: Tools don't maintain current working directory state
2. **Predictability**: Same path works from any context
3. **Error Prevention**: Eliminates "file not found" errors from wrong directory
4. **Security**: Prevents accidental operations in wrong locations

## Path Construction Workflow

### Step 1: Determine Base Directory

First, establish where you're working:

```bash
# Get current directory
pwd
# Output: /home/runner/work/Meowstik/Meowstik

# Store as base
BASE_DIR="/home/runner/work/Meowstik/Meowstik"
```

### Step 2: Construct Full Path

Combine base with relative path:

```
# Want to access: src/components/App.tsx
FULL_PATH="${BASE_DIR}/src/components/App.tsx"
# Result: /home/runner/work/Meowstik/Meowstik/src/components/App.tsx
```

### Step 3: Validate Path Exists (for file_get)

```bash
# Check if file exists
test -f "/home/runner/work/Meowstik/Meowstik/src/components/App.tsx" && echo "exists"
```

### Step 4: Execute Tool

```
file_get("/home/runner/work/Meowstik/Meowstik/src/components/App.tsx")
```

## Common Scenarios

### Scenario 1: Reading a Source File

**Task**: Read `src/App.tsx` in project root

**Steps**:
1. Identify project root: `/home/runner/work/Meowstik/Meowstik`
2. Construct path: `/home/runner/work/Meowstik/Meowstik/src/App.tsx`
3. Verify exists: `test -f /home/runner/work/Meowstik/Meowstik/src/App.tsx`
4. Execute: `file_get("/home/runner/work/Meowstik/Meowstik/src/App.tsx")`

### Scenario 2: Writing a Configuration File

**Task**: Create `config/settings.json`

**Steps**:
1. Identify project root: `/home/runner/work/Meowstik/Meowstik`
2. Construct path: `/home/runner/work/Meowstik/Meowstik/config/settings.json`
3. Ensure directory exists: `mkdir -p /home/runner/work/Meowstik/Meowstik/config`
4. Check permissions: `test -w /home/runner/work/Meowstik/Meowstik/config`
5. Execute: `file_put("/home/runner/work/Meowstik/Meowstik/config/settings.json", content)`

### Scenario 3: Reading from User Home

**Task**: Read `~/documents/notes.txt`

**Steps**:
1. Expand tilde: `echo $HOME` → `/home/runner`
2. Construct path: `/home/runner/documents/notes.txt`
3. Verify exists: `test -f /home/runner/documents/notes.txt`
4. Execute: `file_get("/home/runner/documents/notes.txt")`

## Error Handling

### Common Errors and Solutions

#### Error: "File not found"
```
PermissionError: Permission denied
  at FileWriter.write (/app/tools/file.js:45:12)
```

**Cause**: Using relative path or tilde

**Solution**:
1. Convert to absolute path
2. Verify path exists: `/bin/ls -la /full/path/to/file`
3. Check you're in right directory: `pwd`

#### Error: "Permission denied"
```
PermissionError: Permission denied when writing to /var/log/app.log
```

**Cause**: Trying to write to system directory without permissions

**Solutions**:
1. Use user-writable directory: `/home/runner/...`
2. Don't write to: `/var/log`, `/etc`, `/usr`, `/bin`
3. For temp files use: `/tmp/filename`

#### Error: "No such file or directory"
```
Error: ENOENT: no such file or directory
```

**Cause**: Path doesn't exist or parent directory missing

**Solutions**:
1. Create parent directories first: `mkdir -p /path/to/parent`
2. Verify path spelling: `/bin/ls -la /path/to/parent`
3. Check for typos in path

## Best Practices

### 1. Always Validate Before Operations

**For file_get**:
```bash
# Check file exists and is readable
if test -f "/absolute/path/to/file.txt"; then
    file_get("/absolute/path/to/file.txt")
else
    echo "Error: File does not exist"
fi
```

**For file_put**:
```bash
# Check directory exists and is writable
if test -d "/absolute/path/to/dir" && test -w "/absolute/path/to/dir"; then
    file_put("/absolute/path/to/dir/file.txt", content)
else
    echo "Error: Directory not writable"
fi
```

### 2. Use Environment Variables for Base Paths

```bash
# Set once at start
PROJECT_ROOT="/home/runner/work/Meowstik/Meowstik"
export PROJECT_ROOT

# Use throughout session
file_get("${PROJECT_ROOT}/src/App.tsx")
```

### 3. Log Operations for Debugging

```bash
echo "Reading file: /absolute/path/to/file.txt"
file_get("/absolute/path/to/file.txt")
echo "Operation completed"
```

### 4. Never Assume Current Directory

```bash
# ❌ BAD - Assumes current directory
file_get("./src/App.tsx")

# ✅ GOOD - Explicit full path
file_get("/home/runner/work/Meowstik/Meowstik/src/App.tsx")
```

## Permission Guidelines

### User-Writable Locations (✅ Safe to write)
- `/home/runner/...` - User home directory
- `/tmp/...` - Temporary files (cleaned on reboot)
- `/home/runner/work/Meowstik/Meowstik/...` - Project directory

### System Locations (❌ Do NOT write without sudo)
- `/var/log/...` - System logs
- `/etc/...` - System configuration
- `/usr/...` - System binaries and libraries
- `/bin/...` - Essential system binaries
- `/opt/...` - Optional software packages

## File Path Checklist

Before every file operation:

- [ ] Is the path absolute? (starts with `/`)
- [ ] Is `~` expanded to `/home/username`?
- [ ] Does the file/directory exist? (verify with `test` or `/bin/ls`)
- [ ] Do I have permissions? (check with `test -r` or `test -w`)
- [ ] Are parent directories created? (use `mkdir -p`)
- [ ] Is the path correctly spelled? (no typos)

## Testing Your Paths

Use these commands to test paths before file operations:

```bash
# Test if file exists
test -f "/path/to/file.txt" && echo "File exists" || echo "File not found"

# Test if directory exists
test -d "/path/to/dir" && echo "Directory exists" || echo "Directory not found"

# Test if readable
test -r "/path/to/file.txt" && echo "Readable" || echo "Not readable"

# Test if writable
test -w "/path/to/dir" && echo "Writable" || echo "Not writable"

# List with details
/bin/ls -la "/path/to/file.txt"

# Show full path
realpath "/path/to/file.txt"
```

## Integration with Other Tools

### Getting Absolute Path from Relative

```bash
# If you have relative path
RELATIVE_PATH="src/App.tsx"

# Get current directory
CURRENT_DIR=$(pwd)

# Construct absolute
ABSOLUTE_PATH="${CURRENT_DIR}/${RELATIVE_PATH}"

# Or use realpath if file exists
ABSOLUTE_PATH=$(realpath "${RELATIVE_PATH}")
```

### Converting Tilde Paths

```bash
# If you have tilde path
TILDE_PATH="~/documents/file.txt"

# Expand tilde
ABSOLUTE_PATH="${HOME}/documents/file.txt"

# Or use eval (be careful with untrusted input)
ABSOLUTE_PATH=$(eval echo "${TILDE_PATH}")
```

## Summary

**Golden Rules**:
1. ✅ **Always use absolute paths** starting with `/`
2. ✅ **Expand `~` to `/home/username`** before operations
3. ✅ **Validate paths exist** before operations
4. ✅ **Check permissions** before writing
5. ✅ **Create parent directories** with `mkdir -p`
6. ❌ **Never use relative paths** without converting to absolute
7. ❌ **Never write to system directories** without proper permissions

Following these guidelines will eliminate the majority of file operation errors.

---

**Version**: 1.0.0
**Last Updated**: January 29, 2026
