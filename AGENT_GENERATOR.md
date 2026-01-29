# Agentia Agent Generator

A React-based UI for generating AI agent configurations using Google's Gemini API.

## Features

- **Intuitive Interface**: Simple text-based prompt interface for describing your agent
- **Gemini Integration**: Uses Google's Gemini API to generate structured agent JSON
- **Dual View Modes**:
  - **Preview**: Beautiful card-based visualization of the generated agent
  - **Code**: JSON view with syntax highlighting and copy functionality
- **Responsive Design**: 
  - Desktop (landscape): Adjustable side-by-side layout with resizable panels
  - Mobile (portrait): Stacked layout with chat interface underneath
- **Modern Stack**:
  - Vite + React + TypeScript
  - Tailwind CSS for styling
  - Lucide React for icons
  - Google Generative AI SDK

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## Usage

1. Click the **Settings** button (gear icon) in the top-right corner
2. Enter your Gemini API key
3. Describe your agent in the text area (e.g., "Create a customer support agent that handles billing inquiries")
4. Click **Generate Agent** or press Enter
5. View the generated agent in **Preview** or **Code** mode

## Agent Schema

The generated agents follow this JSON schema:

```json
{
  "id": "unique-agent-id",
  "name": "Agent Name",
  "description": "Brief description of the agent",
  "role": "The agent's primary role",
  "capabilities": ["capability1", "capability2"],
  "tools": [
    {
      "name": "tool-name",
      "description": "tool description"
    }
  ],
  "personality": {
    "tone": "professional/friendly/etc",
    "traits": ["trait1", "trait2"]
  },
  "metadata": {
    "version": "1.0.0",
    "author": "author-name",
    "tags": ["tag1", "tag2"]
  }
}
```

## Project Structure

```
src/
├── components/
│   └── AgentGenerator.tsx   # Main component with UI and Gemini integration
├── types/
│   └── agent.ts             # TypeScript interfaces for agent schema
├── App.tsx                  # Root application component
└── main.tsx                 # Application entry point
```

## Technologies

- **Vite**: Fast build tool and dev server
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Utility-first styling
- **Lucide React**: Icon library
- **@google/generative-ai**: Gemini API SDK

## License

MIT
