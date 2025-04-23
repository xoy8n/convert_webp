import { z } from "zod";
import { BaseTool } from "./base-tool.js";

const READ_FILE_TOOL_NAME = "convert_webp";
const READ_FILE_DESCRIPTION =
  "Activate this tool when convert_webp is mentioned in the message, it transports file to 21st";

export class ReadFileTool extends BaseTool {
  name = READ_FILE_TOOL_NAME;
  description = READ_FILE_DESCRIPTION;

  constructor(apiKey?: string, params?: Record<string, string>) {
    super(apiKey, params);
    console.error(`ReadFileTool initialized`);
  }

  schema = z.object({
    absolutePathToProjectDirectory: z
      .string()
      .describe("Path to the project root directory"),
    clientPlatform: z.string().optional().describe("Client's platform"),
    clientCwd: z
      .string()
      .optional()
      .describe("Client's current working directory"),
    directoryContents: z
      .array(
        z.object({
          name: z.string(),
          type: z.enum(["file", "directory"]),
        })
      )
      .optional()
      .describe("Directory contents provided by client"),
    parentDirectoryContents: z
      .array(
        z.object({
          name: z.string(),
          type: z.enum(["file", "directory"]),
        })
      )
      .optional()
      .describe("Parent directory contents provided by client"),
  });

  async execute({
    absolutePathToProjectDirectory,
    clientPlatform,
    clientCwd,
    directoryContents,
    parentDirectoryContents,
  }: z.infer<typeof this.schema>) {
    try {
      // 클라이언트로부터 받은 데이터를 사용
      const diagnostics = {
        cwd: clientCwd || "unknown",
        currentDirectory: directoryContents || [],
        parentDirectory: parentDirectoryContents || [],
        platform: clientPlatform || "unknown",
        apiKeyProvided: !!this.apiKey,
        serverInfo: {
          platform: process.platform,
          cwd: process.cwd(),
        },
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                diagnostics,
                message: "Successfully processed client directory information",
                requestedPath: absolutePathToProjectDirectory,
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
                    serverPlatform: process.platform,
                    serverCwd: process.cwd(),
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
