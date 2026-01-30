# SSH and WebSocket Requirements

## Overview

This document outlines the future requirements and design considerations for implementing SSH connection support with WebSocket-based 2-way communication in Meowstik.

## Current Limitations

### Current Tool Execution Model

**How it works now**:
1. LLM calls a tool (e.g., `terminal`, `file_put`)
2. Tool executes in isolated context
3. Result returned to LLM
4. No persistent connection maintained

**Limitations**:
1. **No State Persistence**: Each command runs in fresh environment
2. **No Interactive Input**: Cannot respond to prompts (e.g., `sudo` password)
3. **No Real-time Feedback**: Cannot see command output as it happens
4. **PATH Issues**: Environment variables not consistently set
5. **No Session Management**: Cannot maintain directory state, variables, etc.

### Why Commands Fail

**Problem 1: PATH Not Set**
```bash
# This fails: Command not found
find /path -name "*.txt"

# This works: Full path specified
/usr/bin/find /path -name "*.txt"
```

**Problem 2: No Interactive Shell**
```bash
# This fails: Cannot provide input
sudo apt-get install package
# Prompt: [sudo] password for runner: ???

# No way to send password
```

**Problem 3: Environment Lost Between Calls**
```bash
# Call 1
export MY_VAR="value"
cd /home/runner/project

# Call 2 (NEW environment)
echo $MY_VAR  # Empty! Variable lost
pwd           # Not in /home/runner/project anymore
```

## Proposed Solution: SSH + WebSocket

### Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   LLM / Agent   │◄───────►│  WebSocket       │◄───────►│   SSH Server    │
│                 │  JSON    │  Bridge          │  SSH    │                 │
│  (Meowstik)     │  Messages│  (Node.js)       │  Proto  │  (Target Host)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │                            │
                                     │                            │
                                     ▼                            ▼
                            ┌─────────────────┐        ┌──────────────────┐
                            │  WebSocket      │        │  Persistent      │
                            │  Connection     │        │  Shell Session   │
                            │  Manager        │        │  (bash/zsh)      │
                            └─────────────────┘        └──────────────────┘
```

### Key Components

#### 1. WebSocket Server
- **Location**: Runs alongside Spark server
- **Protocol**: WebSocket (ws:// or wss://)
- **Port**: Configurable (default: 3001)
- **Purpose**: Bridge between LLM and SSH session

#### 2. SSH Connection Manager
- **Library**: Use `ssh2` (Node.js) or similar
- **Features**:
  - Connection pooling
  - Authentication (key-based or password)
  - Multiple session support
  - Auto-reconnect on disconnect

#### 3. WebSocket Message Protocol
- **Format**: JSON messages
- **Bidirectional**: Client ↔ Server

**Message Types**:
```javascript
// Client → Server
{
  "type": "connect",
  "host": "localhost",
  "port": 22,
  "username": "runner",
  "auth": { "privateKey": "..." }
}

{
  "type": "execute",
  "sessionId": "session-123",
  "command": "ls -la",
  "waitForOutput": true
}

{
  "type": "input",
  "sessionId": "session-123",
  "data": "password\n"
}

{
  "type": "disconnect",
  "sessionId": "session-123"
}

// Server → Client
{
  "type": "connected",
  "sessionId": "session-123",
  "message": "SSH connection established"
}

{
  "type": "output",
  "sessionId": "session-123",
  "stream": "stdout",
  "data": "file1.txt\nfile2.txt\n"
}

{
  "type": "output",
  "sessionId": "session-123",
  "stream": "stderr",
  "data": "Warning: file not found"
}

{
  "type": "exit",
  "sessionId": "session-123",
  "code": 0
}

{
  "type": "error",
  "sessionId": "session-123",
  "message": "Connection lost"
}
```

## Implementation Plan

### Phase 1: Basic WebSocket Infrastructure

**Files to Create**:
```
spark/src/server/websocket/
├── index.js                 # WebSocket server setup
├── connectionManager.js     # Manage WebSocket connections
├── messageHandler.js        # Handle incoming messages
└── protocol.js              # Message protocol definitions
```

**Key Tasks**:
1. Set up WebSocket server alongside HTTP server
2. Implement connection handshake
3. Create message routing
4. Add basic error handling
5. Implement connection authentication

**Dependencies**:
```json
{
  "dependencies": {
    "ws": "^8.x",              // WebSocket library
    "ssh2": "^1.x",            // SSH client
    "uuid": "^9.x"             // Session IDs
  }
}
```

### Phase 2: SSH Session Management

**Files to Create**:
```
spark/src/server/ssh/
├── sessionManager.js        # Manage SSH sessions
├── connectionPool.js        # Pool SSH connections
├── shellSession.js          # Interactive shell wrapper
└── authManager.js           # Handle SSH authentication
```

**Key Features**:
1. Establish SSH connections
2. Create persistent shell sessions
3. Stream stdout/stderr in real-time
4. Handle interactive prompts
5. Manage session lifecycle

### Phase 3: LLM Integration

**Files to Create/Modify**:
```
src/services/
├── SSHService.ts            # SSH service wrapper
└── TerminalService.ts       # Enhanced terminal with SSH

src/components/
└── TerminalPanel.tsx        # UI for terminal interaction
```

**Key Features**:
1. LLM can request SSH session
2. LLM sends commands to session
3. LLM receives real-time output
4. LLM can send input for prompts
5. Session persists across LLM calls

### Phase 4: Advanced Features

**Features**:
1. **Multiple Sessions**: Support concurrent SSH sessions
2. **Session Persistence**: Maintain sessions between LLM interactions
3. **File Transfer**: SCP/SFTP support
4. **Port Forwarding**: Tunnel connections through SSH
5. **Terminal Emulation**: Full terminal emulator in UI
6. **Session Recording**: Log all commands and output
7. **Security**: Rate limiting, command filtering, audit logging

## Benefits

### For LLM/Agent

1. **Persistent Environment**:
   ```bash
   # All in same session!
   cd /home/runner/project
   export PATH=$PATH:/custom/bin
   source .env
   npm install
   npm run build
   ```

2. **Interactive Commands**:
   ```bash
   # Can handle prompts
   sudo apt-get install package
   # Receives prompt: [sudo] password for runner:
   # Sends: password123
   ```

3. **Real-time Feedback**:
   ```bash
   # See output as it happens
   npm run dev
   # Output streams in real-time:
   # "Starting server..."
   # "Listening on port 3000..."
   ```

4. **Proper PATH**:
   ```bash
   # No more /bin/ls needed
   ls -la          # Works! Uses session's PATH
   find / -name "*"  # Works! Uses session's PATH
   ```

### For Users

1. **Better LLM Performance**: LLM doesn't fight with environment
2. **More Reliable**: Commands work as expected
3. **Interactive**: LLM can handle complex workflows
4. **Transparent**: See all commands and output in real-time
5. **Debuggable**: Session logs available for review

## Security Considerations

### Authentication

**Options**:
1. **SSH Key-based** (Recommended):
   ```javascript
   {
     "privateKey": fs.readFileSync('/path/to/key'),
     "passphrase": "optional-passphrase"
   }
   ```

2. **Password-based** (Development only):
   ```javascript
   {
     "password": "user-password"
   }
   ```

3. **Agent-based**:
   ```javascript
   {
     "agent": process.env.SSH_AUTH_SOCK
   }
   ```

### Security Measures

1. **Connection Limits**:
   - Max concurrent sessions per user
   - Connection rate limiting
   - Session timeout after inactivity

2. **Command Filtering**:
   - Blacklist dangerous commands
   - Whitelist allowed operations
   - Log all executed commands

3. **Access Control**:
   - Require authentication for WebSocket
   - Token-based access for LLM
   - IP whitelisting for connections

4. **Audit Logging**:
   - Log all SSH connections
   - Log all commands executed
   - Log all file transfers
   - Export logs for review

5. **Encryption**:
   - Use wss:// (WebSocket Secure)
   - SSH provides encryption for session
   - Store credentials securely (environment variables, vault)

## Configuration

### Environment Variables

```bash
# SSH Configuration
SSH_HOST=localhost
SSH_PORT=22
SSH_USER=runner
SSH_KEY_PATH=/home/runner/.ssh/id_rsa
SSH_PASSPHRASE=

# WebSocket Configuration
WS_PORT=3001
WS_PATH=/terminal
WS_AUTH_TOKEN=your-secret-token

# Session Configuration
SESSION_TIMEOUT=3600000        # 1 hour in ms
MAX_SESSIONS_PER_USER=5
MAX_OUTPUT_BUFFER=1048576      # 1MB

# Security
ENABLE_COMMAND_FILTERING=true
COMMAND_BLACKLIST=rm -rf /,mkfs,dd
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_PATH=/var/log/meowstik/ssh-audit.log
```

### Configuration File

```javascript
// spark/config/ssh.js
module.exports = {
  ssh: {
    host: process.env.SSH_HOST || 'localhost',
    port: parseInt(process.env.SSH_PORT) || 22,
    username: process.env.SSH_USER || 'runner',
    privateKey: process.env.SSH_KEY_PATH,
    readyTimeout: 20000,
    keepaliveInterval: 10000,
  },
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3001,
    path: process.env.WS_PATH || '/terminal',
    authToken: process.env.WS_AUTH_TOKEN,
  },
  sessions: {
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000,
    maxPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER) || 5,
    maxOutputBuffer: parseInt(process.env.MAX_OUTPUT_BUFFER) || 1048576,
  },
  security: {
    enableCommandFiltering: process.env.ENABLE_COMMAND_FILTERING === 'true',
    commandBlacklist: (process.env.COMMAND_BLACKLIST || '').split(','),
    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
    auditLogPath: process.env.AUDIT_LOG_PATH,
  },
};
```

## Usage Example

### From LLM Perspective

```javascript
// 1. Connect to SSH
const session = await sshService.connect({
  host: 'localhost',
  username: 'runner',
  privateKey: '/path/to/key'
});

// 2. Execute commands in persistent session
await session.execute('cd /home/runner/work/Meowstik/Meowstik');
await session.execute('export NODE_ENV=development');
await session.execute('npm install');

// 3. Run interactive command
const output = await session.execute('npm run dev', {
  realtime: true,  // Stream output
  timeout: null,   // No timeout
});

// 4. Monitor output
session.on('output', (data) => {
  console.log('Server output:', data);
});

// 5. Send input if needed
await session.sendInput('yes\n');

// 6. Disconnect when done
await session.disconnect();
```

## Testing Strategy

### Unit Tests
- WebSocket connection handling
- Message protocol parsing
- SSH connection management
- Command execution

### Integration Tests
- Full LLM → WebSocket → SSH flow
- Session persistence
- Interactive command handling
- Error recovery

### Security Tests
- Authentication mechanisms
- Command filtering
- Rate limiting
- Session isolation

## Milestones

### Milestone 1: Proof of Concept (Week 1-2)
- [ ] Basic WebSocket server
- [ ] SSH connection to localhost
- [ ] Execute single command
- [ ] Return output

### Milestone 2: Session Management (Week 3-4)
- [ ] Persistent shell sessions
- [ ] Multiple command execution
- [ ] Environment preservation
- [ ] Real-time output streaming

### Milestone 3: LLM Integration (Week 5-6)
- [ ] LLM can create sessions
- [ ] LLM can execute commands
- [ ] LLM receives output
- [ ] Error handling

### Milestone 4: Production Ready (Week 7-8)
- [ ] Security hardening
- [ ] Command filtering
- [ ] Audit logging
- [ ] Documentation
- [ ] UI integration

## Future Enhancements

1. **Remote SSH**: Connect to remote servers, not just localhost
2. **SCP/SFTP**: File transfer capabilities
3. **Multiplexing**: Single connection, multiple channels
4. **Terminal Emulation**: Full xterm.js integration in UI
5. **Session Sharing**: Multiple LLMs share same session
6. **Session Replay**: Playback recorded sessions
7. **Jupyter Integration**: Execute notebooks via SSH
8. **Docker Integration**: SSH into containers

## Conclusion

Implementing SSH + WebSocket will fundamentally improve the LLM's ability to interact with the system by:

1. ✅ Eliminating PATH issues
2. ✅ Enabling interactive commands
3. ✅ Maintaining environment state
4. ✅ Providing real-time feedback
5. ✅ Supporting complex workflows

This will reduce errors, improve reliability, and enable more sophisticated agent behaviors.

---

**Status**: Planned for Future Implementation
**Priority**: High
**Complexity**: Medium-High
**Estimated Effort**: 8 weeks
**Dependencies**: WebSocket server, SSH2 library, authentication system

**Version**: 1.0.0
**Last Updated**: January 29, 2026
