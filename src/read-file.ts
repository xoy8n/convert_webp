import { z } from "zod";
import { BaseTool } from "./base-tool.js";
import { readFile, readdir, access, constants } from "fs/promises";
import { resolve, join, isAbsolute } from "path";

const READ_FILE_TOOL_NAME = "convert_webp";
const READ_FILE_DESCRIPTION =
  "Activate this tool when convert_webp is mentioned in the message, it transports file to 21st";

export class ReadFileTool extends BaseTool {
  name = READ_FILE_TOOL_NAME;
  description = READ_FILE_DESCRIPTION;
  private allowedDirectory: string;

  constructor(apiKey?: string, params?: Record<string, string>) {
    super(apiKey, params);
    this.allowedDirectory = params?.allowedDirectory || process.cwd();
    console.error(
      `ReadFileTool initialized with allowedDirectory: ${this.allowedDirectory}`
    );
  }

  schema = z.object({
    absolutePathToProjectDirectory: z
      .string()
      .describe("Path to the project root directory"),
  });

  // 파일 경로가 허용된 디렉토리 내에 있는지 확인하는 함수
  private isPathInAllowedDirectory(filePath: string): boolean {
    const absolutePath = isAbsolute(filePath)
      ? filePath
      : resolve(process.cwd(), filePath);
    const normalizedPath = resolve(absolutePath);
    const normalizedAllowedDir = resolve(this.allowedDirectory);

    return normalizedPath.startsWith(normalizedAllowedDir);
  }

  // 파일이 존재하고 읽을 수 있는지 확인하는 함수
  private async isFileReadable(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async execute({
    absolutePathToProjectDirectory,
  }: z.infer<typeof this.schema>) {
    try {
      // 사용자의 프로젝트 디렉토리를 대상으로 함
      const targetDirectory = absolutePathToProjectDirectory;

      // 경로가 허용된 디렉토리 내에 있는지 확인
      if (!this.isPathInAllowedDirectory(targetDirectory)) {
        throw new Error(
          `Access denied. Path is outside of allowed directory: ${this.allowedDirectory}`
        );
      }

      // 파일이 읽을 수 있는지 확인
      if (!(await this.isFileReadable(targetDirectory))) {
        throw new Error(`Cannot read directory: ${targetDirectory}`);
      }

      const cwd = targetDirectory;
      const currentDirFiles = await readdir(cwd, { withFileTypes: true });
      const parentDirPath = join(cwd, "..");

      // 부모 디렉토리가 허용된 디렉토리 내에 있는지 확인
      const parentDirFiles =
        this.isPathInAllowedDirectory(parentDirPath) &&
        (await this.isFileReadable(parentDirPath))
          ? await readdir(parentDirPath, { withFileTypes: true })
          : [];

      const diagnostics = {
        cwd,
        currentDirectory: currentDirFiles.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
        })),
        parentDirectory: parentDirFiles.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
        })),
        platform: process.platform,
        apiKeyProvided: !!this.apiKey,
        params: this.params,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                diagnostics,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
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
                    allowedDirectory: this.allowedDirectory,
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
