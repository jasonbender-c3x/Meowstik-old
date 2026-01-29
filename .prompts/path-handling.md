# Path Handling Prompt

## Overview

This document covers proper path handling, including tilde (~) expansion, absolute vs relative paths, and path validation.

## The Tilde (~) Problem

### What is Tilde?

The tilde (`~`) is a shell shortcut for the current user's home directory.

**Example**:
- `~` expands to `/home/runner`
- `~/documents` expands to `/home/runner/documents`
- `~username` expands to `/home/username`

### Why Tilde Fails in Tools

**Critical**: Most file tools (file_get, file_put) **do NOT automatically expand tilde**.

```bash
# ❌ This will fail
file_get("~/documents/file.txt")
# Error: File not found at ~/documents/file.txt

# ✅ This will work
file_get("/home/runner/documents/file.txt")
```

### How to Handle Tilde

#### Method 1: Expand Before Using

```bash
# Get home directory
HOME_DIR=$(echo $HOME)
# or
HOME_DIR="/home/runner"

# Construct full path
FILE_PATH="${HOME_DIR}/documents/file.txt"
# Result: /home/runner/documents/file.txt

# Use in tool
file_get("${FILE_PATH}")
```

#### Method 2: Use eval (Caution: Security Risk)

```bash
# Expand tilde (only for trusted paths!)
EXPANDED_PATH=$(eval echo "~/documents/file.txt")
# Result: /home/runner/documents/file.txt

# Use in tool
file_get("${EXPANDED_PATH}")
```

**⚠️ Warning**: Only use `eval` with trusted input. Never use with user-provided paths!

#### Method 3: Replace Tilde Programmatically

```bash
# Replace ~ with $HOME
TILDE_PATH="~/documents/file.txt"
EXPANDED_PATH="${TILDE_PATH/#\~/$HOME}"
# Result: /home/runner/documents/file.txt
```

#### Method 4: Use realpath (If File Exists)

```bash
# If file already exists, use realpath
FULL_PATH=$(/usr/bin/realpath "~/documents/file.txt" 2>/dev/null)
# Result: /home/runner/documents/file.txt
```

### Common Tilde Patterns

```bash
# User home directory
~ → /home/runner

# Subdirectories in home
~/documents → /home/runner/documents
~/downloads → /home/runner/downloads
~/.config → /home/runner/.config

# Another user's home (if permissions allow)
~otheruser → /home/otheruser

# Combined with relative path
~/project/src → /home/runner/project/src
```

## Absolute vs Relative Paths

### Absolute Paths

**Definition**: Paths that start from the root directory (`/`)

**Characteristics**:
- Always start with `/`
- Work from any directory
- Unambiguous
- Preferred for tools

**Examples**:
```bash
/home/runner/work/Meowstik/Meowstik/src/App.tsx
/var/log/app.log
/tmp/tempfile.txt
/etc/config.conf
```

### Relative Paths

**Definition**: Paths relative to current working directory

**Characteristics**:
- Do NOT start with `/`
- Depend on current directory
- Can cause confusion
- Should be converted to absolute

**Examples**:
```bash
./src/App.tsx          # Current directory + src/App.tsx
../config.json         # Parent directory + config.json
src/components/Nav.tsx # Current directory + src/components/Nav.tsx
```

### Converting Relative to Absolute

```bash
# Method 1: Prepend current directory
CURRENT_DIR=$(pwd)
RELATIVE_PATH="src/App.tsx"
ABSOLUTE_PATH="${CURRENT_DIR}/${RELATIVE_PATH}"
# Result: /home/runner/work/Meowstik/Meowstik/src/App.tsx

# Method 2: Use realpath (if path exists)
ABSOLUTE_PATH=$(/usr/bin/realpath "src/App.tsx")

# Method 3: Use readlink -f (if available)
ABSOLUTE_PATH=$(/usr/bin/readlink -f "src/App.tsx")

# Method 4: Manual construction with known base
BASE="/home/runner/work/Meowstik/Meowstik"
RELATIVE="src/App.tsx"
ABSOLUTE="${BASE}/${RELATIVE}"
```

## Path Normalization

### Remove .. (Parent Directory References)

```bash
# Path with parent references
MESSY_PATH="/home/runner/work/../work/Meowstik/Meowstik/./src/App.tsx"

# Normalize
CLEAN_PATH=$(/usr/bin/realpath "${MESSY_PATH}" 2>/dev/null)
# Result: /home/runner/work/Meowstik/Meowstik/src/App.tsx
```

### Remove . (Current Directory References)

```bash
# Path with current directory references
MESSY_PATH="/home/runner/./work/./Meowstik/Meowstik/src/App.tsx"

# Normalize (remove all ./)
CLEAN_PATH="${MESSY_PATH//.\//}"
# Result: /home/runner/work/Meowstik/Meowstik/src/App.tsx
```

### Remove Duplicate Slashes

```bash
# Path with duplicate slashes
MESSY_PATH="/home//runner///work/Meowstik//Meowstik/src/App.tsx"

# Normalize (replace multiple / with single /)
CLEAN_PATH=$(echo "${MESSY_PATH}" | /bin/sed 's|//*|/|g')
# Result: /home/runner/work/Meowstik/Meowstik/src/App.tsx
```

## Path Validation

### Check if Path is Absolute

```bash
# Method 1: Check first character
if [[ "$PATH_TO_CHECK" == /* ]]; then
    echo "Path is absolute"
else
    echo "Path is relative"
fi

# Method 2: Use case statement
case "$PATH_TO_CHECK" in
    /*) echo "Absolute path" ;;
    *) echo "Relative path" ;;
esac
```

### Check if Tilde Needs Expansion

```bash
# Check if path starts with ~
if [[ "$PATH_TO_CHECK" == ~* ]]; then
    echo "Path contains tilde, needs expansion"
    # Expand it
    EXPANDED="${PATH_TO_CHECK/#\~/$HOME}"
else
    echo "Path does not contain tilde"
fi
```

### Validate Path Format

```bash
# Check for common issues
validate_path() {
    local path="$1"
    
    # Check if empty
    if [ -z "$path" ]; then
        echo "Error: Empty path"
        return 1
    fi
    
    # Check if starts with ~
    if [[ "$path" == ~* ]]; then
        echo "Error: Tilde not expanded"
        return 1
    fi
    
    # Check if absolute
    if [[ "$path" != /* ]]; then
        echo "Error: Not an absolute path"
        return 1
    fi
    
    # Check for null bytes
    if echo "$path" | /bin/grep -q $'\0'; then
        echo "Error: Path contains null byte"
        return 1
    fi
    
    echo "Path is valid"
    return 0
}
```

## Path Construction Best Practices

### 1. Start with Known Base

```bash
# Define base directory
PROJECT_ROOT="/home/runner/work/Meowstik/Meowstik"
HOME_DIR="/home/runner"
TEMP_DIR="/tmp"

# Construct paths from base
SOURCE_FILE="${PROJECT_ROOT}/src/App.tsx"
CONFIG_FILE="${HOME_DIR}/.config/app.conf"
TEMP_FILE="${TEMP_DIR}/processing.tmp"
```

### 2. Use Path Joining Function

```bash
# Function to safely join paths
join_path() {
    local base="$1"
    local relative="$2"
    
    # Remove trailing slash from base
    base="${base%/}"
    
    # Remove leading slash from relative
    relative="${relative#/}"
    
    # Join with single slash
    echo "${base}/${relative}"
}

# Usage
FULL_PATH=$(join_path "/home/runner/work" "Meowstik/Meowstik/src/App.tsx")
# Result: /home/runner/work/Meowstik/Meowstik/src/App.tsx
```

### 3. Always Validate Final Path

```bash
# Construct path
CONSTRUCTED_PATH="/home/runner/documents/file.txt"

# Validate
if [[ "$CONSTRUCTED_PATH" == /* ]]; then
    echo "Valid absolute path: $CONSTRUCTED_PATH"
    # Proceed with operation
    file_get("$CONSTRUCTED_PATH")
else
    echo "Error: Invalid path: $CONSTRUCTED_PATH"
fi
```

## Common Path Patterns

### Project Files
```bash
PROJECT_ROOT="/home/runner/work/Meowstik/Meowstik"

# Source files
"${PROJECT_ROOT}/src/components/App.tsx"
"${PROJECT_ROOT}/src/services/api.ts"

# Configuration
"${PROJECT_ROOT}/package.json"
"${PROJECT_ROOT}/.env"

# Build output
"${PROJECT_ROOT}/dist/bundle.js"
"${PROJECT_ROOT}/build/index.html"
```

### User Files
```bash
HOME_DIR="/home/runner"

# Configuration
"${HOME_DIR}/.bashrc"
"${HOME_DIR}/.config/app/settings.json"

# Documents
"${HOME_DIR}/documents/notes.txt"
"${HOME_DIR}/downloads/file.zip"

# Hidden files
"${HOME_DIR}/.ssh/id_rsa"
"${HOME_DIR}/.gitconfig"
```

### System Files
```bash
# Logs
"/var/log/app.log"
"/var/log/syslog"

# Configuration
"/etc/hosts"
"/etc/nginx/nginx.conf"

# Temporary
"/tmp/tempfile.txt"
"/tmp/cache/data.json"
```

## Path Handling Checklist

Before using any path:

- [ ] Is it an absolute path (starts with `/`)?
- [ ] Have I expanded any `~` to full home directory?
- [ ] Have I removed `.` and `..` references?
- [ ] Are there no duplicate slashes?
- [ ] Have I validated the path format?
- [ ] Do I know the base directory if it's constructed?
- [ ] Have I checked if the path exists (for reads)?
- [ ] Have I ensured parent directories exist (for writes)?

## Examples of Complete Path Handling

### Example 1: User Provides Path with Tilde

```bash
# User input
USER_INPUT="~/documents/project/file.txt"

# Step 1: Detect tilde
if [[ "$USER_INPUT" == ~* ]]; then
    echo "Tilde detected, expanding..."
    
    # Step 2: Expand tilde
    EXPANDED_PATH="${USER_INPUT/#\~/$HOME}"
    # Result: /home/runner/documents/project/file.txt
    
    # Step 3: Validate
    if [[ "$EXPANDED_PATH" == /* ]]; then
        echo "Valid path: $EXPANDED_PATH"
        
        # Step 4: Use in tool
        file_get("$EXPANDED_PATH")
    fi
fi
```

### Example 2: Convert Relative to Absolute

```bash
# Relative path
RELATIVE_PATH="src/components/App.tsx"

# Step 1: Get current directory
CURRENT_DIR=$(pwd)
# Result: /home/runner/work/Meowstik/Meowstik

# Step 2: Construct absolute path
ABSOLUTE_PATH="${CURRENT_DIR}/${RELATIVE_PATH}"
# Result: /home/runner/work/Meowstik/Meowstik/src/components/App.tsx

# Step 3: Validate path exists
if test -f "$ABSOLUTE_PATH"; then
    echo "File exists: $ABSOLUTE_PATH"
    
    # Step 4: Use in tool
    file_get("$ABSOLUTE_PATH")
else
    echo "Error: File not found: $ABSOLUTE_PATH"
fi
```

### Example 3: Normalize Messy Path

```bash
# Messy path
MESSY_PATH="/home/runner/../runner/./work/../work/Meowstik/Meowstik/src/./App.tsx"

# Step 1: Use realpath to normalize
CLEAN_PATH=$(/usr/bin/realpath "$MESSY_PATH" 2>/dev/null)

# Step 2: Check if normalization succeeded
if [ -n "$CLEAN_PATH" ]; then
    echo "Normalized path: $CLEAN_PATH"
    # Result: /home/runner/work/Meowstik/Meowstik/src/App.tsx
    
    # Step 3: Use in tool
    file_get("$CLEAN_PATH")
else
    echo "Error: Could not normalize path: $MESSY_PATH"
fi
```

## Summary

**Golden Rules**:
1. ✅ **Always expand tilde (~)** to full home directory path before using in tools
2. ✅ **Always convert relative paths** to absolute paths
3. ✅ **Always normalize paths** to remove `.`, `..`, and duplicate slashes
4. ✅ **Always validate path format** before operations
5. ✅ **Start with known base directories** when constructing paths
6. ❌ **Never pass paths with `~`** directly to file tools
7. ❌ **Never use relative paths** without converting to absolute
8. ❌ **Never assume shell expansion** will happen in tools

Following these guidelines will eliminate path-related errors.

---

**Version**: 1.0.0
**Last Updated**: January 29, 2026
