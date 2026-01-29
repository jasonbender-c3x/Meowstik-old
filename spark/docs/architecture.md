# Spark Architecture

This document describes the technical architecture of Spark, the web application prototyping and development tool.

## System Overview

Spark is built as a client-server application with real-time communication capabilities. It provides a code editor on one side and a live preview pane on the other, enabling instant feedback during development.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Client                          │
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────┐       │
│  │   Code Editor Pane   │    │   Preview Pane       │       │
│  │  ┌────────────────┐  │    │  ┌────────────────┐ │       │
│  │  │ Monaco Editor  │  │    │  │  Sandboxed     │ │       │
│  │  │                │  │    │  │  iframe        │ │       │
│  │  │ - Syntax       │  │    │  │                │ │       │
│  │  │   Highlighting │  │    │  │ - HTML/CSS/JS  │ │       │
│  │  │ - Autocomplete │  │    │  │ - React/Vue    │ │       │
│  │  │ - Error Check  │  │    │  │ - CSP Security │ │       │
│  │  └────────────────┘  │    │  └────────────────┘ │       │
│  └──────────┬───────────┘    └──────────┬──────────┘       │
│             │                            │                   │
│             └────────────┬───────────────┘                   │
│                          │                                   │
│                  ┌───────▼────────┐                          │
│                  │  State Manager │                          │
│                  │  (React/Vue)   │                          │
│                  │                │                          │
│                  │ - Code State   │                          │
│                  │ - Preview State│                          │
│                  │ - Settings     │                          │
│                  └───────┬────────┘                          │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                   HTTP / WebSocket
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    Spark Server (Node.js)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Express.js Server                       │ │
│  │                                                           │ │
│  │  REST API Endpoints:                                     │ │
│  │  - GET  /api/health          - Server health check      │ │
│  │  - GET  /api/projects        - List projects            │ │
│  │  - POST /api/projects        - Create project           │ │
│  │  - GET  /api/projects/:id    - Get project details      │ │
│  │  - PUT  /api/projects/:id    - Update project           │ │
│  │  - DELETE /api/projects/:id  - Delete project           │ │
│  │                                                           │ │
│  │  WebSocket Events:                                       │ │
│  │  - code:update    - Real-time code changes              │ │
│  │  - preview:reload - Trigger preview refresh             │ │
│  │  - error:report   - Report compilation errors           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              File System Manager                         │ │
│  │  - Project storage                                       │ │
│  │  - Template management                                   │ │
│  │  - Export functionality                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Build Pipeline                              │ │
│  │  - Babel transpilation                                   │ │
│  │  - Bundling (Webpack/Vite)                              │ │
│  │  - Hot Module Replacement                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Client-Side Architecture

#### Code Editor (Monaco Editor)
- **Technology**: Monaco Editor (VS Code's editor)
- **Features**:
  - Syntax highlighting for HTML, CSS, JavaScript, React JSX, Vue
  - IntelliSense autocomplete
  - Error detection and linting
  - Multiple file tabs
  - Keyboard shortcuts

#### Preview Pane
- **Technology**: Sandboxed iframe with Content Security Policy
- **Features**:
  - Real-time rendering
  - Isolated execution environment
  - Console output capture
  - Responsive design testing
  - Device emulation

#### State Management
- **Technology**: React Context or Vue Store
- **Responsibilities**:
  - Manage editor content
  - Track active files
  - Handle user preferences
  - Synchronize with server

### 2. Server-Side Architecture

#### Express.js Server
- **Port**: 3000 (configurable)
- **Responsibilities**:
  - Serve static assets
  - Provide REST API
  - Handle WebSocket connections
  - Manage authentication (future)

#### File System Manager
- **Storage**: Local filesystem
- **Structure**:
  ```
  projects/
    ├── project-id-1/
    │   ├── index.html
    │   ├── styles.css
    │   ├── script.js
    │   └── package.json
    └── project-id-2/
        └── ...
  ```

#### Build Pipeline
- **Transpilation**: Babel for React JSX and modern JS
- **Bundling**: Webpack or Vite for module bundling
- **HMR**: Hot Module Replacement for instant updates

## Data Flow

### Code Edit Flow
1. User types in Monaco Editor
2. Editor emits change event
3. State manager updates code state
4. WebSocket sends update to server (optional save)
5. Preview pane receives update
6. Preview re-renders with new code

### Preview Update Flow
1. Code change detected
2. Build pipeline processes code
3. Generated bundle injected into preview iframe
4. Preview renders updated application
5. Console output captured and displayed

## Security Architecture

### Sandbox Isolation
- Preview runs in sandboxed iframe
- Content Security Policy (CSP) headers
- No access to parent window
- Limited API exposure

### Code Execution Safety
- No server-side code execution of user code
- All code runs client-side in sandbox
- XSS protection through CSP
- Input sanitization

## Technology Stack

### Frontend
- **Framework**: React or Vue (TBD)
- **Editor**: Monaco Editor
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State**: Context API / Vuex

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **WebSocket**: ws library
- **File System**: fs-extra

### Development
- **Language**: JavaScript (TypeScript future consideration)
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint
- **Formatting**: Prettier

## Deployment Architecture

### Development
```
npm run dev
├── Start Express server (port 3000)
├── Watch for file changes
└── Enable hot reload
```

### Production
```
npm run build && npm start
├── Build optimized client bundle
├── Start production server
└── Serve static assets with caching
```

## Performance Considerations

### Code Editor
- Virtual scrolling for large files
- Syntax highlighting worker threads
- Debounced updates to preview

### Preview Pane
- Throttled re-renders
- Incremental DOM updates
- Efficient iframe communication

### Server
- In-memory caching for frequent requests
- Gzip compression for responses
- CDN for static assets (future)

## Scalability

### Phase 1 (Current)
- Single server instance
- Local file storage
- In-memory sessions

### Phase 2 (Future)
- Horizontal scaling with load balancer
- Cloud storage (S3/equivalent)
- Redis for session management
- Database for user data

## Extension Points

### Plugin System (Future)
- Custom code transformers
- Additional language support
- Theme customization
- Component library extensions

### API Integration (Future)
- GitHub integration for version control
- NPM package integration
- Third-party service connectors

## Development Workflow

1. **Local Development**:
   ```bash
   npm install
   npm run dev
   ```

2. **Testing**:
   ```bash
   npm test
   ```

3. **Building**:
   ```bash
   npm run build
   ```

4. **Deployment**:
   ```bash
   npm start
   ```

## Future Enhancements

- [ ] Real-time collaboration (multiple users)
- [ ] Cloud storage integration
- [ ] Version control system
- [ ] Component library marketplace
- [ ] Mobile app support
- [ ] AI-assisted code completion
- [ ] Performance profiling tools
- [ ] A/B testing capabilities

---

*Last Updated: January 29, 2026*
