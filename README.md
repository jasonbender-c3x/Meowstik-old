# Meowstik

**Agentia Compiler**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-latest-brightgreen.svg)](DOCUMENTATION_INDEX.md)

## Table of Contents

- [Overview](#overview)
- [Sub-Projects](#sub-projects)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

Meowstik is an Agentia Compiler, a specialized compiler toolchain for the Agentia programming paradigm.

> **Note**: This project is currently in early development. Features and documentation will be added as the project evolves.

## Sub-Projects

Meowstik is organized into several sub-projects, each focusing on specific aspects of the compiler toolchain:

| Sub-Project | Description | Status |
|-------------|-------------|--------|
| [**Spark**](spark/README.md) | Web app prototyping & development tool with live preview pane - Node.js, React/Vue editor similar to Gemini canvas | 🚧 In Development |

> More sub-projects will be added as the Meowstik ecosystem grows.

## Features

*Features will be documented as they are implemented during active development.*

## Getting Started

### Prerequisites

*Prerequisites will be added as the project develops.*

### Installation

*Installation instructions will be added as the project develops.*

```bash
# Installation commands will go here
```

## Usage

*Usage examples and guides will be added as the project develops.*

```bash
# Usage examples will go here
```

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
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
