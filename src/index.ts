import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { convertToWebP } from "./convert.js";

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

server.tool(
  "convert_base64_to_webp",
  {
    base64_image: z.string(),
    output_path: z.string(),
    quality: z.number().default(80),
    lossless: z.boolean().default(false),
  },
  async (params) => {
    const { convertBase64ToWebP } = await import("./convert.js");
    const result = await convertBase64ToWebP(
      params.base64_image,
      params.output_path,
      params.quality,
      params.lossless
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("서버 연결 오류:", error);
  process.exit(1);
});
