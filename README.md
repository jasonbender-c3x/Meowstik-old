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
import { getGeminiService } from './src/GeminiService.js';

// Get the singleton service instance
const service = getGeminiService();

// Generate an agent from a natural language prompt
const agent = await service.generateAgent(
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

### Using Factory Function

```typescript
import { createGeminiService } from './src/GeminiService.js';

// Create with environment variable
const service1 = createGeminiService();

// Create with explicit API key
const service2 = createGeminiService('your-api-key');
```

## API Reference

### `GeminiService`

#### `constructor(apiKey?: string)`
Creates a new instance of the GeminiService.

**Parameters:**
- `apiKey` (optional): Google Gemini API key. If not provided, reads from `GEMINI_API_KEY` environment variable.

Throws an error if no API key is available.

#### `generateAgent(prompt: string): Promise<AgentSpecification>`
Generates an agent specification from a natural language prompt.

**Parameters:**
- `prompt`: A natural language description of the desired agent (max 10,000 characters)

**Returns:**
- A Promise that resolves to an `AgentSpecification` object

**Throws:**
- Error if prompt is empty, too long, or if API call fails

#### Helper Functions

##### `getGeminiService(): GeminiService`
Returns the singleton instance of GeminiService (lazy initialization).

##### `createGeminiService(apiKey?: string): GeminiService`
Factory function to create a new GeminiService instance.

**Parameters:**
- `apiKey` (optional): Google Gemini API key

#### Type: `AgentSpecification`

```typescript
interface AgentSpecification {
  name: string;
  description: string;
  capabilities: string[];
  parameters: Record<string, any>;
}
```

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
