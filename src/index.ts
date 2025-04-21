#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ConvertToWebpTool } from "./convert.js";

// 명령줄 인수 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (const arg of args) {
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

console.log("PARAMS", params);
console.log("API_KEY", API_KEY);

console.log("Starting WebP Conversion MCP server...");
const server = new McpServer({
  name: "webp-convert-mcp",
  version: "1.0.0",
});

// 도구 등록
new ConvertToWebpTool(API_KEY, params).register(server);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WebP Conversion MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
