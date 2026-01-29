// Agent JSON Schema for Agentia Compiler
export interface AgentSchema {
  id: string;
  name: string;
  description: string;
  role: string;
  capabilities: string[];
  tools: Tool[];
  personality?: {
    tone?: string;
    traits?: string[];
  };
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
  };
}

export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export const defaultAgentSchema: Partial<AgentSchema> = {
  capabilities: [],
  tools: [],
  personality: {
    tone: "professional",
    traits: ["helpful", "accurate", "concise"]
  }
};
