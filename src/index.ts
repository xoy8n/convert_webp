#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

// 서버 초기화
const server = new McpServer({
  name: "WebP Converter",
  version: "1.0.0",
});

/**
 * 이미지 파일을 WebP 형식으로 변환합니다.
 */
async function convertToWebP(
  imagePath: string,
  quality: number = 80,
  lossless: boolean = false,
  keepOriginal: boolean = false
): Promise<any> {
  try {
    // 입력 파일이 존재하는지 확인
    if (!fs.existsSync(imagePath)) {
      throw new Error(`입력 파일이 존재하지 않습니다: ${imagePath}`);
    }

    // 이미지 확장자 확인
    const ext = path.extname(imagePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) {
      throw new Error(`지원되지 않는 이미지 형식입니다: ${ext}`);
    }

    // 출력 파일명 생성
    const filename = path.basename(imagePath, ext);
    const outputPath = path.join(path.dirname(imagePath), `${filename}.webp`);

    // 변환 옵션 설정
    const options = { quality, lossless };

    // 이미지 변환
    await sharp(imagePath).webp(options).toFile(outputPath);

    // 원본 파일 삭제 여부 확인
    if (!keepOriginal) {
      fs.unlinkSync(imagePath);
    }

    // 결과 반환
    return {
      success: true,
      input_path: imagePath,
      output_path: outputPath,
      size_before: fs.statSync(keepOriginal ? imagePath : outputPath).size,
      size_after: fs.statSync(outputPath).size,
      quality,
      lossless,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      input_path: imagePath,
    };
  }
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

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("서버 연결 오류:", error);
  process.exit(1);
});
