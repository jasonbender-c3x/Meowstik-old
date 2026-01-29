import { geminiService } from './GeminiService.js';

/**
 * Example usage of the GeminiService
 */
async function main() {
  try {
    console.log('Testing Gemini Service...\n');

    // Example 1: Simple agent
    const prompt1 = 'Create an agent that monitors system health and sends alerts';
    console.log(`Prompt: ${prompt1}`);
    const agent1 = await geminiService.generateAgent(prompt1);
    console.log('Generated Agent:', JSON.stringify(agent1, null, 2));
    console.log('\n---\n');

    // Example 2: More complex agent
    const prompt2 = 'Create a data analysis agent that can process CSV files and generate visualizations';
    console.log(`Prompt: ${prompt2}`);
    const agent2 = await geminiService.generateAgent(prompt2);
    console.log('Generated Agent:', JSON.stringify(agent2, null, 2));

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
