# Command Execution Prompt

## Overview

This document provides guidelines for executing shell commands correctly, avoiding "command not found" errors.

## Critical Issue: Command Path Resolution

**Problem**: Commands like `find`, `ls`, `grep` fail with "command not found" or "nix package not found"

**Root Cause**: The PATH environment variable may not be configured properly, or the system uses Nix package manager with non-standard paths.

## Solution: Use Absolute Command Paths

### ✅ CORRECT Examples
```bash
/bin/ls -la /home/runner
/usr/bin/find /home/runner -name "*.txt"
/bin/grep -r "search term" /path/to/dir
/bin/cat /path/to/file.txt
/usr/bin/which node
```

### ❌ INCORRECT Examples
```bash
ls -la /home/runner                    # May fail: command not found
find /home/runner -name "*.txt"        # May fail: nix package not found
grep -r "search term" /path/to/dir     # May fail: PATH not set correctly
```

## Common Command Locations

### Essential Commands (Usually in /bin/)
```bash
/bin/ls       # List directory contents
/bin/cat      # Display file contents
/bin/mkdir    # Create directories
/bin/rm       # Remove files
/bin/cp       # Copy files
/bin/mv       # Move/rename files
/bin/pwd      # Print working directory
/bin/echo     # Print text
/bin/bash     # Bash shell
/bin/sh       # Shell
/bin/chmod    # Change permissions
/bin/chown    # Change ownership
```

### Common Utilities (Usually in /usr/bin/)
```bash
/usr/bin/find     # Find files
/usr/bin/grep     # Search text
/usr/bin/awk      # Text processing
/usr/bin/sed      # Stream editor
/usr/bin/which    # Locate commands
/usr/bin/whereis  # Find binary/source/man pages
/usr/bin/head     # Show first lines
/usr/bin/tail     # Show last lines
/usr/bin/sort     # Sort lines
/usr/bin/uniq     # Remove duplicates
/usr/bin/wc       # Count words/lines
/usr/bin/cut      # Cut columns
/usr/bin/tr       # Translate characters
/usr/bin/xargs    # Build command lines
```

### System Administration (Usually in /usr/bin/ or /sbin/)
```bash
/usr/bin/ps       # Process status
/usr/bin/top      # System monitor
/usr/bin/df       # Disk space
/usr/bin/du       # Disk usage
/usr/bin/free     # Memory info
/usr/bin/uptime   # System uptime
```

### Development Tools (Usually in /usr/bin/)
```bash
/usr/bin/git      # Version control
/usr/bin/node     # Node.js
/usr/bin/npm      # Node package manager
/usr/bin/python3  # Python
/usr/bin/gcc      # C compiler
/usr/bin/make     # Build tool
```

## How to Find Command Locations

### Method 1: Use which (with full path)
```bash
# Find where a command is located
/usr/bin/which ls
# Output: /bin/ls

/usr/bin/which find
# Output: /usr/bin/find
```

### Method 2: Use whereis
```bash
# Find binary, source, and manual page
/usr/bin/whereis ls
# Output: ls: /bin/ls /usr/share/man/man1/ls.1.gz

/usr/bin/whereis grep
# Output: grep: /bin/grep /usr/share/man/man1/grep.1.gz
```

### Method 3: Try Common Locations
```bash
# Check if command exists in /bin
test -x /bin/ls && echo "Found in /bin" || echo "Not in /bin"

# Check if command exists in /usr/bin
test -x /usr/bin/find && echo "Found in /usr/bin" || echo "Not in /usr/bin"
```

### Method 4: Search for the command
```bash
# Search in common binary directories
/usr/bin/find /bin /usr/bin /usr/local/bin -name "grep" 2>/dev/null
```

## Best Practices

### 1. Create a Command Lookup Function

At the start of your session, locate commonly used commands:

```bash
# Locate common commands
LS=$(/usr/bin/which ls 2>/dev/null || echo "/bin/ls")
FIND=$(/usr/bin/which find 2>/dev/null || echo "/usr/bin/find")
GREP=$(/usr/bin/which grep 2>/dev/null || echo "/bin/grep")
CAT=$(/usr/bin/which cat 2>/dev/null || echo "/bin/cat")

# Use throughout session
$LS -la /home/runner
$FIND /home/runner -name "*.txt"
$GREP -r "search" /path/to/dir
```

### 2. Always Test Commands First

Before using a command in production:

```bash
# Test if command exists
if test -x /bin/ls; then
    echo "ls is available at /bin/ls"
    /bin/ls -la
else
    echo "ls not found at /bin/ls"
fi
```

### 3. Provide Fallbacks

```bash
# Try multiple possible locations
if test -x /bin/grep; then
    /bin/grep "pattern" file.txt
elif test -x /usr/bin/grep; then
    /usr/bin/grep "pattern" file.txt
else
    echo "Error: grep not found"
fi
```

### 4. Use Portable Commands When Possible

Some commands are universally available:

```bash
# These should work on most systems
/bin/sh -c "echo 'Hello'"
/bin/cat /path/to/file
/bin/ls -la
```

## Handling Nix Package Manager

If the system uses Nix package manager, paths may be in `/nix/store/`:

### Detecting Nix Environment
```bash
# Check if Nix is present
if test -d /nix; then
    echo "Nix package manager detected"
    # Nix commands might be in /nix/store/...-package-version/bin/
fi
```

### Finding Nix Commands
```bash
# If standard paths fail, look in Nix store
if ! test -x /bin/node && ! test -x /usr/bin/node; then
    # Try to find in Nix
    NIX_NODE=$(/usr/bin/find /nix/store -name "node" -type f 2>/dev/null | head -1)
    if test -n "$NIX_NODE"; then
        echo "Found node in Nix: $NIX_NODE"
        $NIX_NODE --version
    fi
fi
```

### Using nix-shell
```bash
# If available, use nix-shell to get proper environment
if test -x /usr/bin/nix-shell; then
    /usr/bin/nix-shell -p nodejs --run "node --version"
fi
```

## Common Command Patterns

### File Operations
```bash
# List files
/bin/ls -la /path/to/directory

# Find files
/usr/bin/find /path/to/search -name "*.txt" -type f

# Count files
/usr/bin/find /path/to/dir -type f | /usr/bin/wc -l

# Search in files
/bin/grep -r "search term" /path/to/dir
```

### Text Processing
```bash
# Display file
/bin/cat /path/to/file.txt

# Show first 10 lines
/usr/bin/head -n 10 /path/to/file.txt

# Show last 10 lines
/usr/bin/tail -n 10 /path/to/file.txt

# Count lines
/usr/bin/wc -l /path/to/file.txt
```

### Directory Operations
```bash
# Create directory
/bin/mkdir -p /path/to/new/directory

# Remove directory
/bin/rm -rf /path/to/directory

# Change to directory (use cd, it's a shell builtin)
cd /path/to/directory
```

### File Checks
```bash
# Check if file exists
test -f /path/to/file && echo "exists" || echo "not found"

# Check if directory exists
test -d /path/to/dir && echo "exists" || echo "not found"

# Check if executable
test -x /bin/ls && echo "executable" || echo "not executable"
```

## Troubleshooting

### Issue 1: "command not found"

**Diagnosis**:
```bash
# Check current PATH
echo $PATH

# Try to locate command
/usr/bin/which problematic_command
/usr/bin/whereis problematic_command
```

**Solution**:
1. Use absolute path: `/bin/command` or `/usr/bin/command`
2. Find the command: `/usr/bin/find / -name "command" 2>/dev/null`
3. Update PATH if needed: `export PATH=$PATH:/additional/path`

### Issue 2: "nix package not found"

**Diagnosis**:
```bash
# Check if Nix is in use
test -d /nix && echo "Nix detected"

# Check available Nix profiles
/bin/ls -la ~/.nix-profile 2>/dev/null
```

**Solution**:
1. Use absolute paths for standard commands
2. For Nix-managed packages, use nix-shell
3. Source Nix profile: `. ~/.nix-profile/etc/profile.d/nix.sh`

### Issue 3: Command works interactively but not in scripts

**Cause**: Interactive shells load ~/.bashrc, scripts don't

**Solution**:
1. Use absolute paths in scripts
2. Or source the profile: `. /etc/profile`
3. Set PATH explicitly: `export PATH=/bin:/usr/bin:$PATH`

## Command Execution Checklist

Before executing any command:

- [ ] Do I know the full path to the command?
- [ ] Have I tested that the command exists? (`test -x /path/to/command`)
- [ ] Am I using absolute paths for files and directories?
- [ ] Have I handled the case where the command might not exist?
- [ ] Am I providing proper error messages?
- [ ] Have I considered Nix package manager environments?

## Emergency Command Discovery

If you need to find where a command is:

```bash
# Method 1: which (if available)
/usr/bin/which command_name 2>/dev/null

# Method 2: Search common locations
for dir in /bin /usr/bin /usr/local/bin /sbin /usr/sbin; do
    test -x "$dir/command_name" && echo "Found: $dir/command_name"
done

# Method 3: Global search (slow but thorough)
/usr/bin/find /bin /usr -name "command_name" -type f 2>/dev/null

# Method 4: Check if it's a shell builtin
type command_name
```

## Built-in Shell Commands

Some commands are shell built-ins and don't need paths:

```bash
cd /path/to/dir      # Change directory (builtin)
pwd                  # Print working directory (builtin)
echo "text"          # Print text (builtin)
export VAR=value     # Set environment variable (builtin)
. /path/to/script    # Source script (builtin)
type command         # Show command type (builtin)
```

## Summary

**Golden Rules**:
1. ✅ **Always use absolute command paths** like `/bin/ls` or `/usr/bin/find`
2. ✅ **Test command existence** before using: `test -x /bin/ls`
3. ✅ **Locate commands first** with `/usr/bin/which` or `/usr/bin/whereis`
4. ✅ **Provide fallbacks** for commands that might be in different locations
5. ✅ **Handle Nix environments** specially if detected
6. ❌ **Never assume PATH is set** correctly
7. ❌ **Never use bare command names** like `find` or `grep` without testing

Following these guidelines will eliminate "command not found" errors.

---

**Version**: 1.0.0
**Last Updated**: January 29, 2026
