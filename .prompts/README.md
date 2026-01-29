# Prompts Directory

This directory contains guidance files for LLM/AI interactions with the Meowstik system.

## Purpose

These prompt files provide clear instructions to language models on how to:
- Interact with file system tools correctly
- Execute commands with proper paths
- Handle directory structures
- Expand shell shortcuts like `~`
- Avoid common pitfalls

## Files

| File | Purpose |
|------|---------|
| `file-operations.md` | Guidelines for file_get and file_put tool usage |
| `command-execution.md` | Best practices for terminal/shell command execution |
| `directory-navigation.md` | Understanding and navigating directory structures |
| `path-handling.md` | Absolute vs relative paths, tilde expansion |
| `ssh-websocket-requirements.md` | Future requirements for SSH with WebSocket support |

## Usage

When an LLM interacts with Meowstik, it should:

1. **Read these prompts** at the start of any file or command operation
2. **Follow the guidelines** strictly to avoid common errors
3. **Use absolute paths** whenever possible
4. **Validate paths** before operations
5. **Handle errors gracefully** with informative messages

## Common Issues Addressed

### 1. File Operations Failing
**Problem**: file_get/file_put tools fail without absolute paths
**Solution**: Always use absolute paths (see `file-operations.md`)

### 2. Tilde (~) Not Expanding
**Problem**: Paths like `~/documents` don't work
**Solution**: Expand ~ to full home directory path (see `path-handling.md`)

### 3. Commands Not Found
**Problem**: Commands like `find` or `ls` fail
**Solution**: Use full paths like `/bin/ls` or `/usr/bin/find` (see `command-execution.md`)

### 4. Directory Confusion
**Problem**: Model loses track of current directory
**Solution**: Always track and use absolute paths (see `directory-navigation.md`)

## Quick Reference

### ✅ DO
- Use absolute paths: `/home/user/file.txt`
- Use full command paths: `/bin/ls -la`
- Validate paths exist before operations
- Expand `~` to `/home/username`
- Check permissions before writing
- Provide full context in error messages

### ❌ DON'T
- Use relative paths without context: `./file.txt`
- Use bare commands: `find` or `ls`
- Assume `~` will be expanded automatically
- Navigate without tracking current directory
- Write to system directories without permissions
- Give vague error messages

## Error Prevention

Following these prompts will help prevent:
- PermissionError when writing files
- Command not found errors
- Path resolution failures
- Directory navigation confusion
- Tilde expansion issues

## Future Enhancements

Planned improvements to the tool interaction system:
- SSH connection support for direct shell access
- WebSocket-based 2-way communication
- Real-time command execution feedback
- Interactive terminal emulation
- Better error recovery mechanisms

## Maintenance

These prompts should be:
- Updated when new issues are discovered
- Reviewed for consistency regularly
- Enhanced based on error logs from Evolution Center
- Kept synchronized with tool implementations

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0
**Maintainer**: jason@oceanshorestech.com
