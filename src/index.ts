#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { convertToWebP } from "./convert.js";
import { stat } from "fs/promises";
import { existsSync } from "fs";

const server = new McpServer({
  name: "WebP Converter",
  version: "1.0.0",
});

server.tool(
  "convert_to_webp",
  {
    image_path: z.string(),
    quality: z.number().default(80),
    lossless: z.boolean().default(false),
    keep_original: z.boolean().default(false),
  },
  async (params) => {
    const result = await convertToWebP(
      params.image_path,
      params.quality,
      params.lossless,
      params.keep_original
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "batch_convert_to_webp",
  {
    image_paths: z.array(z.string()),
    quality: z.number().default(80),
    lossless: z.boolean().default(false),
    keep_original: z.boolean().default(false),
  },
  async (params) => {
    const results = [];

    for (const imagePath of params.image_paths) {
      if (existsSync(imagePath)) {
        const fileStat = await stat(imagePath);

        if (!fileStat.isFile()) {
          results.push({
            success: false,
            error: "디렉토리는 지원되지 않습니다. 개별 파일만 입력해주세요.",
            input_path: imagePath,
          });
          continue;
        }

        const result = await convertToWebP(
          imagePath,
          params.quality,
          params.lossless,
          params.keep_original
        );
        results.push(result);
      } else {
        results.push({
          success: false,
          error: `파일이 존재하지 않습니다: ${imagePath}`,
          input_path: imagePath,
        });
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("서버 연결 오류:", error);
  process.exit(1);
});
