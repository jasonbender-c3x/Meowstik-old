# Spark Documentation

This directory contains comprehensive documentation for the Spark sub-project - a web application prototyping and development tool.

## Contents

### Core Documentation

- [Architecture](architecture.md) - System design, components, and technical architecture
- [API Reference](api.md) - Server API endpoints and WebSocket events *(coming soon)*
- [Usage Guide](usage-guide.md) - Comprehensive usage examples *(coming soon)*
- [Component Library](components.md) - Available UI components *(coming soon)*
- [Deployment Guide](deployment.md) - Production deployment instructions *(coming soon)*

## Overview

Spark is a Node.js-based web application that provides:

1. **Live Code Editor**: Monaco Editor with syntax highlighting and autocomplete
2. **Real-time Preview**: Sandboxed iframe showing live results
3. **Multi-Framework Support**: React, Vue, and vanilla JavaScript
4. **Hot Module Replacement**: Instant updates without page refresh

## Quick Links

### For Users
- [Getting Started](../README.md#getting-started) - Installation and basic usage
- [Features](../README.md#key-features) - Complete feature list
- Usage examples *(coming soon)*

### For Developers
- [Architecture](architecture.md) - System design and technical details
- [Contributing](../../CONTRIBUTING.md) - How to contribute
- API documentation *(coming soon)*

### For Operators
- Deployment guide *(coming soon)*
- Configuration reference *(coming soon)*
- Monitoring and troubleshooting *(coming soon)*

## Architecture Highlights

Spark uses a client-server architecture with:

- **Frontend**: React/Vue with Monaco Editor for code editing
- **Backend**: Node.js with Express for API and file management
- **Preview**: Sandboxed iframe with Content Security Policy
- **Communication**: REST API + WebSocket for real-time updates

See the [Architecture Guide](architecture.md) for detailed information.

## Technology Stack

### Frontend
- Monaco Editor (VS Code's editor)
- React or Vue framework
- Tailwind CSS for styling
- Vite for build tooling

### Backend
- Node.js v18+
- Express.js framework
- WebSocket (ws) for real-time communication
- File system management

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Documentation Structure

The Spark documentation is organized as follows:

```
docs/
├── README.md           # This file - documentation overview
├── architecture.md     # System architecture and design
├── api.md             # API reference (coming soon)
├── usage-guide.md     # Usage examples (coming soon)
├── components.md      # Component library (coming soon)
└── deployment.md      # Deployment guide (coming soon)
```

## Key Concepts

### Code Editor
The Monaco Editor provides a VS Code-like editing experience with:
- Syntax highlighting for multiple languages
- IntelliSense autocomplete
- Error detection
- Multiple file support

### Preview Pane
The preview pane shows your code running in real-time:
- Sandboxed execution for security
- Automatic refresh on code changes
- Console output capture
- Responsive design testing

### State Management
Application state is managed centrally:
- Current code content
- Active files and tabs
- User preferences
- Project metadata

### Build Pipeline
Code is processed before preview:
- Babel transpilation for modern JS
- Module bundling
- Hot Module Replacement
- Error handling

## Feature Roadmap

### Phase 1: Foundation ✅
- [x] Project structure
- [x] Basic server setup
- [x] Documentation framework

### Phase 2: Core Features (In Progress)
- [ ] Monaco Editor integration
- [ ] Preview pane implementation
- [ ] File management
- [ ] Basic React support

### Phase 3: Advanced Features
- [ ] Vue framework support
- [ ] Component library
- [ ] Template system
- [ ] Export functionality

### Phase 4: Production
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Deployment tools
- [ ] Monitoring

## Contributing to Documentation

We welcome documentation improvements! To contribute:

1. Identify gaps or errors
2. Fork the repository
3. Make your changes
4. Submit a pull request

See [Contributing Guidelines](../../CONTRIBUTING.md) for details.

## Need Help?

- 📖 Read the [full documentation](architecture.md)
- 💬 Join [discussions](https://github.com/jasonbender-c3x/Meowstik/discussions)
- 🐛 Report [issues](https://github.com/jasonbender-c3x/Meowstik/issues)
- 📧 Email: jason@oceanshorestech.com

---

*This documentation will be continuously updated as Spark develops.*

For main project documentation, see the [Meowstik Documentation Index](../../DOCUMENTATION_INDEX.md).

