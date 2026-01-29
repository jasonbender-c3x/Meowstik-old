/**
 * Example usage of the MeowstikAI service
 * 
 * To use this example:
 * 1. Set the GEMINI_API_KEY environment variable
 * 2. Run: npm run build && node dist/services/example.js
 */

import { generateAgentSpec, MeowstikGenerationError } from './MeowstikAI';

async function main() {
  try {
    const prompt = `Generate an agent specification with the following properties:
    - name: "DataAnalysisAgent"
    - description: "An agent that analyzes data and generates insights"
    - capabilities: ["data_processing", "visualization", "statistical_analysis"]
    - parameters: { "max_rows": 10000, "output_format": "json" }
    
    Return the response as a JSON object matching this structure.`;

    console.log('Generating agent specification...\n');
    const agentSpec = await generateAgentSpec(prompt);
    
    console.log('Generated Agent Specification:');
    console.log(JSON.stringify(agentSpec, null, 2));
  } catch (error) {
    if (error instanceof MeowstikGenerationError) {
      console.error('Generation Error:', error.message);
      if (error.cause) {
        console.error('Cause:', error.cause);
      }
    } else {
      console.error('Unexpected Error:', error);
    }
    process.exit(1);
  }
}

main();
