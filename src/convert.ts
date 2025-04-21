import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { join, dirname, basename, extname } from "path";
import sharp from "sharp";
import { readdir } from "fs/promises";

const CONVERT_TOOL_NAME = "convert_webp";
const CONVERT_DESCRIPTION =
  "Activate this tool when convert_to_webp is mentioned in the message, it converts image files to webp format";

// BaseTool 클래스 정의 (app/utils/base-tool.ts에서 복사)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodObject<any>;
  protected apiKey?: string;
  protected params?: Record<string, string>;
  constructor(apiKey?: string, params?: Record<string, string>) {
    this.apiKey = apiKey;
    this.params = params;
  }

  register(server: McpServer) {
    server.tool(
      this.name,
      this.description,
      this.schema.shape,
      this.execute.bind(this)
    );
  }

  abstract execute(args: z.infer<typeof this.schema>): Promise<{
    content: Array<{ type: "text"; text: string }>;
  }>;
}

export class ConvertToWebpTool extends BaseTool {
  name = CONVERT_TOOL_NAME;
  description = CONVERT_DESCRIPTION;

  schema = z.object({
    absolutePathToProjectDirectory: z
      .string()
      .describe("Path to the project root directory"),
    relativePathToProjectDirectory: z
      .string()
      .describe("Relative path to the project root directory"),
  });

  async execute({
    absolutePathToProjectDirectory,
    relativePathToProjectDirectory,
  }: z.infer<typeof this.schema>) {
    try {
      const cwd = process.cwd();
      const targetDir = absolutePathToProjectDirectory;

      // 디렉토리 내의 파일 목록을 가져옴
      const files = await readdir(targetDir, { withFileTypes: true });

      // 지원하는 이미지 확장자
      const supportedExtensions = [".png", ".jpg", ".jpeg"];

      // 변환할 이미지 파일 필터링
      const imageFiles = files
        .filter(
          (file) =>
            file.isFile() &&
            supportedExtensions.includes(extname(file.name).toLowerCase())
        )
        .map((file) => file.name);

      // 변환 결과를 저장할 배열
      const conversionResults = [];

      // 각 이미지를 WebP로 변환
      for (const file of imageFiles) {
        const inputPath = join(targetDir, file);
        const outputPath = join(
          targetDir,
          `${basename(file, extname(file))}.webp`
        );

        // 이미지 파일 읽기
        const inputBuffer = await readFile(inputPath);

        // sharp를 사용하여 WebP로 변환
        const outputBuffer = await sharp(inputBuffer)
          .webp({ quality: 80 }) // 품질 설정 (0-100)
          .toBuffer();

        // 변환된 WebP 파일 저장
        await writeFile(outputPath, outputBuffer);

        conversionResults.push({
          originalFile: file,
          convertedFile: `${basename(file, extname(file))}.webp`,
          size: {
            original: inputBuffer.length,
            converted: outputBuffer.length,
            reductionPercent: Math.round(
              (1 - outputBuffer.length / inputBuffer.length) * 100
            ),
          },
        });
      }

      // 실행 환경에 대한 진단 정보
      const diagnostics = {
        cwd,
        targetDirectory: targetDir,
        imageFiles,
        platform: process.platform,
        env: process.env.NODE_ENV,
        apiKeyProvided: !!this.apiKey,
        params: this.params,
      };

      // 결과 반환
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                diagnostics,
                conversionResults,
                message:
                  imageFiles.length > 0
                    ? `성공적으로 ${imageFiles.length}개의 이미지를 WebP로 변환했습니다.`
                    : "변환할 이미지 파일을 찾지 못했습니다.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
      // 오류 발생 시 진단 정보 반환
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: {
                  message: error.message,
                  code: error.code,
                  path: error.path,
                  diagnostics: {
                    cwd: process.cwd(),
                    currentDirectory: await readdir(process.cwd(), {
                      withFileTypes: true,
                    }).then((files) =>
                      files.map((entry) => ({
                        name: entry.name,
                        type: entry.isDirectory() ? "directory" : "file",
                      }))
                    ),
                    parentDirectory: await readdir(join(process.cwd(), ".."), {
                      withFileTypes: true,
                    }).then((files) =>
                      files.map((entry) => ({
                        name: entry.name,
                        type: entry.isDirectory() ? "directory" : "file",
                      }))
                    ),
                    platform: process.platform,
                    apiKeyProvided: !!this.apiKey,
                  },
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
}
