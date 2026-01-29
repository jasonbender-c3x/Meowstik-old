# Directory Navigation Prompt

## Overview

This document provides guidelines for understanding and navigating directory structures in the Meowstik project and system.

## Understanding Directory Structure

### The Filesystem Hierarchy

```
/                           (Root directory - top of filesystem)
├── home/                   (User home directories)
│   └── runner/            (Current user's home)
│       ├── work/          (GitHub Actions workspace)
│       │   └── Meowstik/
│       │       └── Meowstik/  (Project root)
│       │           ├── src/
│       │           ├── docs/
│       │           ├── package.json
│       │           └── ...
│       └── ...
├── tmp/                    (Temporary files)
├── var/                    (Variable data)
│   └── log/               (System logs)
├── etc/                    (System configuration)
├── usr/                    (User programs)
│   └── bin/               (User binaries)
└── bin/                    (Essential binaries)
```

## Project Directory Structure

### Meowstik Project Layout

```
/home/runner/work/Meowstik/Meowstik/
├── .prompts/              # LLM guidance prompts (this directory)
│   ├── README.md
│   ├── file-operations.md
│   ├── command-execution.md
│   ├── path-handling.md
│   └── directory-navigation.md
├── src/                   # Source code
│   ├── components/        # React components
│   ├── services/          # Business logic services
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   ├── architecture/     # Architecture docs
│   ├── development/      # Development guides
│   ├── examples/         # Code examples
│   └── user-guide/       # User guides
├── spark/                 # Spark sub-project
│   ├── src/
│   │   └── server/       # Server code
│   ├── public/           # Static assets
│   └── docs/             # Spark documentation
├── tersty/                # Test infrastructure
│   ├── tests/            # Test definitions
│   ├── templates/        # Test templates
│   └── procedures/       # Test procedures
├── public/                # Public assets
├── services/              # Additional services
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## Navigation Best Practices

### 1. Always Know Your Current Directory

```bash
# Get current directory
CURRENT_DIR=$(pwd)
echo "Currently in: $CURRENT_DIR"

# Before any operation, verify location
/bin/ls -la
```

### 2. Use Absolute Paths for Operations

```bash
# ❌ BAD - Relies on current directory
file_get("src/App.tsx")

# ✅ GOOD - Explicit absolute path
file_get("/home/runner/work/Meowstik/Meowstik/src/App.tsx")
```

### 3. Navigate with Context

```bash
# Document where you're going and why
echo "Navigating to project source directory"
cd /home/runner/work/Meowstik/Meowstik/src

# Verify arrival
pwd
/bin/ls -la
```

### 4. Use Variables for Common Paths

```bash
# Define at start of session
PROJECT_ROOT="/home/runner/work/Meowstik/Meowstik"
SRC_DIR="${PROJECT_ROOT}/src"
DOCS_DIR="${PROJECT_ROOT}/docs"
TESTS_DIR="${PROJECT_ROOT}/tersty/tests"

# Use throughout
cd "$SRC_DIR"
file_get("${SRC_DIR}/App.tsx")
/bin/ls -la "$DOCS_DIR"
```

## Directory Operations

### Checking Directory Existence

```bash
# Check if directory exists
if test -d "/home/runner/work/Meowstik/Meowstik/src"; then
    echo "Directory exists"
else
    echo "Directory does not exist"
fi
```

### Creating Directories

```bash
# Create single directory
/bin/mkdir /path/to/new/directory

# Create nested directories (recommended)
/bin/mkdir -p /path/to/nested/new/directory

# Example: Create directories for new feature
/bin/mkdir -p /home/runner/work/Meowstik/Meowstik/src/components/NewFeature
```

### Listing Directory Contents

```bash
# Basic listing
/bin/ls /path/to/directory

# Detailed listing (recommended)
/bin/ls -la /path/to/directory

# Only directories
/bin/ls -ld /path/to/parent/*/

# Tree view (if available)
/usr/bin/tree /path/to/directory
```

### Finding Files in Directories

```bash
# Find by name
/usr/bin/find /home/runner/work/Meowstik/Meowstik -name "*.tsx"

# Find by type (files only)
/usr/bin/find /home/runner/work/Meowstik/Meowstik/src -type f

# Find by type (directories only)
/usr/bin/find /home/runner/work/Meowstik/Meowstik/src -type d

# Find with depth limit
/usr/bin/find /home/runner/work/Meowstik/Meowstik -maxdepth 2 -name "*.json"
```

## Common Navigation Patterns

### Pattern 1: Exploring a New Directory

```bash
# Step 1: Go to directory
cd /home/runner/work/Meowstik/Meowstik

# Step 2: Verify location
pwd

# Step 3: List contents
/bin/ls -la

# Step 4: Understand structure
/bin/ls -la src/
/bin/ls -la docs/

# Step 5: Find specific files
/usr/bin/find . -name "*.tsx" -type f | /usr/bin/head -20
```

### Pattern 2: Working in Multiple Directories

```bash
# Save current directory
SAVED_DIR=$(pwd)

# Do work in another directory
cd /home/runner/work/Meowstik/Meowstik/src
# ... operations ...

# Return to saved directory
cd "$SAVED_DIR"
```

### Pattern 3: Iterating Over Subdirectories

```bash
# Process all subdirectories
for dir in /home/runner/work/Meowstik/Meowstik/src/*/; do
    if test -d "$dir"; then
        echo "Processing: $dir"
        /bin/ls -la "$dir"
    fi
done
```

## Understanding Special Directories

### Current Directory (.)

```bash
# . refers to current directory
/bin/ls .           # List current directory
/bin/ls ./src       # List src in current directory

# ✅ Best practice: Don't rely on current directory
# Always use absolute paths
```

### Parent Directory (..)

```bash
# .. refers to parent directory
cd ..               # Go up one level
/bin/ls ../         # List parent directory

# ✅ Best practice: Use absolute paths instead
cd /home/runner/work/Meowstik  # Instead of cd ..
```

### Home Directory (~)

```bash
# ~ refers to home directory (/home/runner)
# ⚠️ WARNING: Tools don't expand ~ automatically

# ❌ BAD
file_get("~/documents/file.txt")

# ✅ GOOD
file_get("/home/runner/documents/file.txt")
```

### Root Directory (/)

```bash
# / is the top-level directory
/bin/ls /           # List root directory
cd /                # Go to root (rarely needed)
```

### Temporary Directory (/tmp)

```bash
# /tmp for temporary files
TEMP_FILE="/tmp/processing.tmp"
echo "data" > "$TEMP_FILE"

# Clean up when done
/bin/rm "$TEMP_FILE"
```

## Directory Permission Checks

### Check if Directory is Readable

```bash
# Test read permission
if test -r /path/to/directory; then
    echo "Directory is readable"
    /bin/ls "$directory"
else
    echo "Cannot read directory"
fi
```

### Check if Directory is Writable

```bash
# Test write permission
if test -w /path/to/directory; then
    echo "Directory is writable"
    # Safe to create files here
else
    echo "Cannot write to directory"
fi
```

### Check if Directory is Executable (Can Enter)

```bash
# Test execute permission (needed to cd into directory)
if test -x /path/to/directory; then
    echo "Can enter directory"
    cd /path/to/directory
else
    echo "Cannot enter directory"
fi
```

## Directory Context Management

### Maintaining State Across Operations

```bash
# Create state file to track current context
STATE_FILE="/tmp/meowstik_directory_state.txt"

# Save current directory context
save_context() {
    pwd > "$STATE_FILE"
    echo "Context saved: $(pwd)"
}

# Load directory context
load_context() {
    if test -f "$STATE_FILE"; then
        SAVED_DIR=$(/bin/cat "$STATE_FILE")
        echo "Last context: $SAVED_DIR"
    else
        echo "No saved context"
    fi
}

# Usage
save_context
# ... do other work ...
load_context
```

### Directory Stack (pushd/popd)

```bash
# If available, use directory stack
pushd /home/runner/work/Meowstik/Meowstik/src
# ... work in src ...
popd  # Return to previous directory

# View directory stack
dirs
```

## Common Directory Mistakes

### Mistake 1: Assuming Current Directory

```bash
# ❌ BAD - Assumes you're in project root
file_get("src/App.tsx")

# ✅ GOOD - Explicit path
file_get("/home/runner/work/Meowstik/Meowstik/src/App.tsx")
```

### Mistake 2: Not Verifying Directory Changes

```bash
# ❌ BAD - cd without verification
cd some/directory
/bin/ls *.txt

# ✅ GOOD - Verify after cd
cd some/directory
if [ $? -eq 0 ]; then
    pwd  # Verify location
    /bin/ls *.txt
else
    echo "Error: Could not change directory"
fi
```

### Mistake 3: Using Relative Paths Across Operations

```bash
# ❌ BAD - Relative paths break if directory changes
cd /some/path
file1="./file1.txt"
cd /other/path
file_get("$file1")  # Will look in wrong place!

# ✅ GOOD - Absolute paths work from anywhere
file1="/home/runner/work/Meowstik/Meowstik/file1.txt"
cd /other/path
file_get("$file1")  # Still works!
```

## Directory Navigation Checklist

Before any directory operation:

- [ ] Do I know my current directory? (`pwd`)
- [ ] Am I using absolute paths?
- [ ] Have I verified the directory exists? (`test -d`)
- [ ] Do I have the necessary permissions? (`test -r`, `test -w`, `test -x`)
- [ ] Have I documented where I am and why?
- [ ] Will my paths still work if I change directories?
- [ ] Am I tracking my location for later reference?

## Quick Reference Commands

```bash
# Where am I?
pwd

# What's here?
/bin/ls -la

# Does directory exist?
test -d /path/to/dir && echo "exists" || echo "not found"

# Can I enter?
test -x /path/to/dir && echo "can enter" || echo "cannot enter"

# Can I read?
test -r /path/to/dir && echo "can read" || echo "cannot read"

# Can I write?
test -w /path/to/dir && echo "can write" || echo "cannot write"

# How many files/subdirectories?
/bin/ls -la /path/to/dir | /usr/bin/wc -l

# Find all subdirectories
/usr/bin/find /path/to/dir -type d

# Directory size
/usr/bin/du -sh /path/to/dir
```

## Project-Specific Navigation

### Quick Access to Common Locations

```bash
# Project root
PROJECT_ROOT="/home/runner/work/Meowstik/Meowstik"

# Source code
cd "$PROJECT_ROOT/src"

# Components
cd "$PROJECT_ROOT/src/components"

# Services
cd "$PROJECT_ROOT/src/services"

# Documentation
cd "$PROJECT_ROOT/docs"

# Tests
cd "$PROJECT_ROOT/tersty/tests"

# Spark server
cd "$PROJECT_ROOT/spark/src/server"
```

### Finding Specific File Types

```bash
# All TypeScript files
/usr/bin/find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.tsx"

# All test files
/usr/bin/find "$PROJECT_ROOT/tersty" -name "*.test.json"

# All documentation
/usr/bin/find "$PROJECT_ROOT/docs" -name "*.md"

# All configuration files
/usr/bin/find "$PROJECT_ROOT" -maxdepth 1 -name "*.json" -o -name "*.config.*"
```

## Summary

**Golden Rules**:
1. ✅ **Always know your current directory** with `pwd`
2. ✅ **Always use absolute paths** for file operations
3. ✅ **Always verify directory exists** before entering or operating
4. ✅ **Always check permissions** before operations
5. ✅ **Document your location** and navigation intent
6. ✅ **Use variables** for frequently accessed directories
7. ❌ **Never assume current directory** state
8. ❌ **Never use relative paths** without absolute context
9. ❌ **Never change directories** without verification

Following these guidelines will eliminate directory navigation confusion.

---

**Version**: 1.0.0
**Last Updated**: January 29, 2026
