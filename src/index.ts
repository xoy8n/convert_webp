#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { convertToWebP, getImageFilesInDirectory } from "./convert.js";
import { readdir, stat } from "fs/promises";
import { resolve, join, extname } from "path";
import { existsSync } from "fs";

// 서버 초기화
const server = new McpServer({
  name: "WebP Converter",
  version: "1.0.0",
});

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
    try {
      // 단일 파일 변환
      const result = await convertToWebP(
        params.image_path,
        params.quality,
        params.lossless,
        params.keep_original
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error.message,
                input_path: params.image_path,
              },
              null,
              2
            ),
          },
        ],
      };
    }
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
    try {
      const results = [];

      for (const imagePath of params.image_paths) {
        const absolutePath = resolve(imagePath);

        // 파일 상태 확인
        if (existsSync(absolutePath)) {
          const fileStat = await stat(absolutePath);

          if (fileStat.isDirectory()) {
            // 디렉토리인 경우 모든 이미지 변환
            const imageFiles = await getImageFilesInDirectory(absolutePath);

            for (const imageFile of imageFiles) {
              const result = await convertToWebP(
                imageFile,
                params.quality,
                params.lossless,
                params.keep_original
              );
              results.push(result);
            }
          } else {
            // 단일 파일 변환
            const result = await convertToWebP(
              absolutePath,
              params.quality,
              params.lossless,
              params.keep_original
            );
            results.push(result);
          }
        } else {
          results.push({
            success: false,
            error: `파일이 존재하지 않습니다: ${absolutePath}`,
            input_path: absolutePath,
          });
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("서버 연결 오류:", error);
  process.exit(1);
});
