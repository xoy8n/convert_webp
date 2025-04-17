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
 * 파일 경로를 컨테이너 내부에서 접근 가능한 경로로 변환합니다.
 */
function resolvePath(filePath: string): string {
  // 절대 경로인 경우
  if (path.isAbsolute(filePath)) {
    // Docker 컨테이너 내에서 실행 중인지 확인
    const isInDocker = fs.existsSync("/.dockerenv");

    if (isInDocker) {
      // 현재 작업 디렉토리 확인
      const workdir = process.cwd();

      // 상대 경로로 시도
      const relativePath = path.join(workdir, path.basename(filePath));
      if (fs.existsSync(relativePath)) {
        console.log(`파일을 상대 경로로 발견: ${relativePath}`);
        return relativePath;
      }

      // 원본 경로가 존재하는지 확인
      if (fs.existsSync(filePath)) {
        return filePath;
      }

      console.log(
        `경고: 파일을 찾을 수 없습니다. 절대 경로: ${filePath}, 상대 경로: ${relativePath}`
      );
      console.log(`현재 작업 디렉토리: ${workdir}`);
      return filePath; // 원래 경로 반환, convertToWebP에서 오류 처리됨
    }
  }

  // 상대 경로이거나 Docker 밖에서 실행 중이면 원래 경로 사용
  return filePath;
}

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
    // 경로 해석
    const resolvedPath = resolvePath(imagePath);

    // 입력 파일이 존재하는지 확인
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `입력 파일이 존재하지 않습니다: ${resolvedPath} (원본 경로: ${imagePath})`
      );
    }

    // 이미지 확장자 확인
    const ext = path.extname(resolvedPath).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) {
      throw new Error(`지원되지 않는 이미지 형식입니다: ${ext}`);
    }

    // 출력 파일명 생성
    const filename = path.basename(resolvedPath, ext);
    const outputPath = path.join(
      path.dirname(resolvedPath),
      `${filename}.webp`
    );

    // 변환 옵션 설정
    const options = { quality, lossless };

    // 이미지 변환
    await sharp(resolvedPath).webp(options).toFile(outputPath);

    // 원본 파일 삭제 여부 확인
    if (!keepOriginal) {
      fs.unlinkSync(resolvedPath);
    }

    // 결과 반환
    return {
      success: true,
      input_path: imagePath, // 사용자가 제공한 원래 경로 반환
      resolved_path: resolvedPath, // 실제 사용된 경로
      output_path: outputPath,
      size_before: fs.statSync(keepOriginal ? resolvedPath : outputPath).size,
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
