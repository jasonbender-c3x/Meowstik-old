# Meowstik
Agentia Compiler

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-latest-brightgreen.svg)](DOCUMENTATION_INDEX.md)

## Overview

Meowstik is an Agentia Compiler, a specialized compiler toolchain for the Agentia programming paradigm with a TypeScript service for generating agent specifications using Google's Gemini AI API.

> **Note**: This project is currently in early development. Features and documentation will be added as the project evolves.

## Features

- 🤖 Natural language to agent specification conversion
- 📝 Enforced JSON output format
- 🔑 Environment variable based API key management
- 🛡️ Type-safe TypeScript implementation
- ⚡ Simple and easy-to-use API
- 🎨 IDE Layout with split-pane interface

## Sub-Projects

Meowstik is organized into several sub-projects, each focusing on specific aspects of the compiler toolchain:

| Sub-Project | Description | Status |
|-------------|-------------|--------|
| [**Spark**](spark/README.md) | Web app prototyping & development tool with live preview pane - Node.js, React/Vue editor similar to Gemini canvas | 🚧 In Development |

> More sub-projects will be added as the Meowstik ecosystem grows.

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Add your Google Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://ai.google.dev/

## Development

Run development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## IDE Layout

The Meowstik IDE features a split-pane layout:
- **Left Pane (Intent Panel)**: Textarea for entering prompts
- **Right Pane (Artifact Preview)**: Renders JSON cards
- **Resizable Divider**: Drag to adjust pane sizes

The interface uses a VS Code-inspired dark theme with slate-900 backgrounds.

## Documentation

For comprehensive documentation, please refer to:

- [Documentation Index](DOCUMENTATION_INDEX.md) - Complete guide to all project documentation
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to this project
- [API Reference](docs/api/README.md) - API documentation (coming soon)
- [Architecture](docs/architecture/README.md) - System architecture details (coming soon)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to:

- Report bugs
- Suggest features
- Submit pull requests
- Follow coding standards

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Project Owner**: Jason Bender
- **Email**: jason@oceanshorestech.com
- **Repository**: [jasonbender-c3x/Meowstik](https://github.com/jasonbender-c3x/Meowstik)

---

*Last Updated: January 29, 2026*
