#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { convertToWebP } from "./convert.js";
import { join, dirname, resolve } from "path";
import { existsSync } from "fs";

// 서버 초기화
const server = new McpServer({
  name: "WebP Converter",
  version: "1.0.0",
});

// 허용된 디렉토리 체크
const ALLOWED_DIR = process.env.ALLOWED_DIR;

// 경로가 허용된 디렉토리 내에 있는지 확인하는 함수
function isPathAllowed(path: string): boolean {
  // 허용된 디렉토리가 설정되지 않은 경우, 모든 경로 허용
  if (!ALLOWED_DIR) return true;

  const absolutePath = resolve(path);
  const allowedPath = resolve(ALLOWED_DIR);

  return absolutePath.startsWith(allowedPath);
}

// 도구 정의
server.tool(
  "convert_to_webp",
  {
    image_path: z.string(),
    quality: z.number().default(80),
    lossless: z.boolean().default(false),
    keep_original: z.boolean().default(false),
  },
  async (params) => {
    // 경로 검증
    if (!isPathAllowed(params.image_path)) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: "허용되지 않은 디렉토리에 접근하려고 합니다",
                input_path: params.image_path,
              },
              null,
              2
            ),
          },
        ],
      };
    }

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
      // 경로 검증
      if (!isPathAllowed(imagePath)) {
        results.push({
          success: false,
          error: "허용되지 않은 디렉토리에 접근하려고 합니다",
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
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("서버 연결 오류:", error);
  process.exit(1);
});
