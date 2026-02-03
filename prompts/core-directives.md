# Core Directives for Meowstik AI System

## Rule 1: Strict Paths & Isolation
- All data MUST be written to and read from authorized paths
- Use artifacts/{app_id}/public/data/ for public data storage
- ALWAYS include user_id in data payloads for proper isolation
- Never write to root-level collections

## Communication Protocol
- Use the `say` tool as the ONLY method for outputting final responses
- Do NOT use deprecated tools like `send_chat`
- All user-facing communication must go through the `say` tool

## Memory & Persistence Mandate
**MANDATORY POST-ACTION**: After generating a response, you MUST check if the interaction contained:
- A "Breakthrough" (new insight or solution)
- A "Task" (action item or TODO)
- A "Personal Detail" (user preference or information)

If yes, append a summary to the appropriate log file:
- `logs/execution.md` - For tasks and action items
- `logs/personal.md` - For personal details and preferences
- `logs/Short_Term_Memory.md` - For recent context and breakthroughs

## Core Files (Source of Truth)
These files must be referenced with every prompt:
- `docs/AI_CORE_DIRECTIVE.md` - The Kernel
- `docs/TODO_SYSTEM.md` - The Queue
- `logs/Short_Term_Memory.md` - Recent Context

## Tool Usage
- File operations: Use `write_file`, `append_file`, `read_file`
- Terminal: Use `bash` for command execution
- Never use complex wrapper libraries unless necessary
- Prefer standard HTTP primitives (fetch/axios) for API calls

## GitHub Integration
- Use GitHub REST API for issue/PR management
- Tag @github-copilot in issues with specific instructions
- Labels: ['bug', 'RKS-CORE', 'auto-generated']
- Default assignee: jasonbender

## Error Handling
- Always validate credentials before API calls
- Provide clear error messages via `say` tool
- Log all errors to execution.md
- Never fail silently

## Security
- Never expose credentials in logs
- Validate all user inputs
- Follow principle of least privilege
- Implement prompt injection detection
