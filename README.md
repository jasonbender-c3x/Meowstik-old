# Meowstik
Agentia Compiler - AI-powered agent specification generator with strict JSON validation

## Features

- 🤖 **Gemini 1.5 Flash Integration**: Uses Google's latest Gemini 1.5 Flash model for agent generation
- ✅ **Strict JSON Validation**: Enforces `application/json` MIME type for guaranteed JSON responses
- 🛡️ **Runtime Validation**: Uses Zod schemas to validate generated specifications
- 🎯 **Type Safety**: Full TypeScript support with exported types
- ⚠️ **Custom Error Handling**: Typed `MeowstikGenerationError` for better error handling

## Installation

```bash
npm install
```

## Dependencies

- `@google/generative-ai` - Google Generative AI SDK
- `zod` - TypeScript-first schema validation

## Setup

1. Set your Gemini API key as an environment variable:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

2. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Basic Usage

```typescript
import { generateAgentSpec, MeowstikGenerationError } from 'meowstik';

async function example() {
  try {
    const prompt = `Generate an agent specification for a data analysis agent with capabilities including data processing, visualization, and statistical analysis.`;
    
    const agentSpec = await generateAgentSpec(prompt);
    console.log(agentSpec);
    // Output: { name: "...", description: "...", capabilities: [...], parameters: {...} }
  } catch (error) {
    if (error instanceof MeowstikGenerationError) {
      console.error('Generation failed:', error.message);
    }
  }
}
```

### Agent Schema

The generated agent specification conforms to the following schema:

```typescript
{
  name: string;           // Agent name
  description: string;    // Agent description
  capabilities: string[]; // Array of agent capabilities
  parameters?: Record<string, any>; // Optional parameters
}
```

### Error Handling

The service throws a typed `MeowstikGenerationError` for any failures:

- Missing API key
- JSON parsing errors
- Schema validation failures
- API errors

```typescript
try {
  const spec = await generateAgentSpec(prompt);
} catch (error) {
  if (error instanceof MeowstikGenerationError) {
    console.error(error.message);
    console.error(error.cause); // Original error if available
  }
}
```

## Running the Example

```bash
npm run build
node dist/services/example.js
```

## API Reference

### `generateAgentSpec(prompt: string): Promise<AgentSpec>`

Generates an agent specification using Gemini 1.5 Flash with strict JSON output.

**Parameters:**
- `prompt` (string): The prompt to generate the agent specification

**Returns:**
- `Promise<AgentSpec>`: A validated agent specification

**Throws:**
- `MeowstikGenerationError`: If generation or validation fails

### `AgentSchema`

Zod schema used for runtime validation of generated agent specifications.

### `MeowstikGenerationError`

Custom error class for generation failures. Includes:
- `message`: Error description
- `cause`: Original error if available

## Development

### Build

```bash
npm run build
```

### Project Structure

```
Meowstik/
├── services/
│   ├── MeowstikAI.ts    # Main service implementation
│   └── example.ts       # Usage example
├── index.ts             # Main exports
├── tsconfig.json        # TypeScript configuration
└── package.json         # Package configuration
```

## License

ISC

