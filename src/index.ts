#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ReadFileTool } from "./read-file.js";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  // 첫 번째 인자는 allowedDirectory로 처리
  if (args.length > 0) {
    params.allowedDirectory = args[0];
  }

  // 나머지 인자들은 기존 방식대로 처리
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") || arg.startsWith("—")) {
      const [key, value] = arg.replace(/^(-{1,2}|—)/, "").split("=");
      if (key && value) {
        params[key] = value.replace(/^["'](.*)["']$/, "$1");
      }
    }
  }

  return params;
}

const params = parseArgs();
const API_KEY = params.API_KEY || process.env.API_KEY;

console.error(
  `Server initialized with allowedDirectory: ${params.allowedDirectory}`
);

const server = new McpServer({
  name: "fs-mcp",
  version: "0.0.2",
});

// Register tools
new ReadFileTool(API_KEY, params).register(server);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sequential Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
