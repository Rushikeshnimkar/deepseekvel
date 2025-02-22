import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { z } from "zod";

// Define a sample tool
const exampleTool = tool(
  async ({ input }) => {
    return `Processed: ${input}`;
  },
  {
    name: "exampleTool",
    description: "A sample tool that processes input",
    schema: z.object({
      input: z.string().describe("The input to process"),
    }),
  }
);

// Define web search tool using Tavily
const searchTool = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 3,
  // Set to true if you want more comprehensive but slower results
  includeRawContent: true
});

// Configure OpenRouter
const model = new ChatOpenAI({
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000", // Required
      "X-Title": process.env.YOUR_APP_NAME || "Test App", // Optional
    },
  },
  modelName: "google/gemini-2.0-flash-lite-preview-02-05:free", // Choose your preferred model
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  temperature: 0.7,
});

// Initialize memory
const checkpointer = new MemorySaver();

// Create the agent
const agent = createReactAgent({
  llm: model,
  tools: [searchTool, exampleTool],
  checkpointSaver: checkpointer,
});

// Example usage function
async function runAgent(userInput: string) {
  try {
    const result = await agent.invoke(
      {
        messages: [{
          role: "user",
          content: userInput
        }]
      },
      { configurable: { thread_id: Date.now() } }
    );
    
    return result.messages.at(-1)?.content;
  } catch (error) {
    console.error("Error running agent:", error);
    throw error;
  }
}

// Example usage
async function main() {
  const response = await runAgent("who are tye actor in the movie chhaava");
  console.log("Agent response:", response);
}

// Run the example (comment out if you're importing this as a module)
 main();