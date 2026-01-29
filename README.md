# Meowstik
Agentia Compiler

A TypeScript service for generating agent specifications using Google's Gemini AI API.

## Features

- 🤖 Natural language to agent specification conversion
- 📝 Enforced JSON output format
- 🔑 Environment variable based API key management
- 🛡️ Type-safe TypeScript implementation
- ⚡ Simple and easy-to-use API

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

## Usage

### Basic Usage

```typescript
import { geminiService } from './src/GeminiService.js';

// Generate an agent from a natural language prompt
const agent = await geminiService.generateAgent(
  'Create an agent that monitors system health and sends alerts'
);

console.log(agent);
```

### Using the Class Directly

```typescript
import { GeminiService } from './src/GeminiService.js';

const service = new GeminiService();
const agent = await service.generateAgent('Your prompt here');
```

## API Reference

### `GeminiService`

#### `constructor()`
Creates a new instance of the GeminiService. Reads the `GEMINI_API_KEY` from environment variables.

Throws an error if `GEMINI_API_KEY` is not set.

#### `generateAgent(prompt: string): Promise<object>`
Generates an agent specification from a natural language prompt.

**Parameters:**
- `prompt`: A natural language description of the desired agent

**Returns:**
- A Promise that resolves to a JSON object containing the agent specification

**Example Response:**
```json
{
  "name": "System Health Monitor",
  "description": "Monitors system health metrics and sends alerts",
  "capabilities": [
    "CPU monitoring",
    "Memory monitoring",
    "Alert notifications"
  ],
  "parameters": {
    "checkInterval": "60s",
    "alertThreshold": "80%"
  }
}
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

## Project Structure

```
.
├── src/
│   ├── GeminiService.ts    # Main service implementation
│   ├── index.ts            # Package exports
│   └── example.ts          # Usage examples
├── dist/                   # Compiled JavaScript output
├── .env.example            # Example environment variables
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

## License

ISC
