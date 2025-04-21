import { unlink, stat, readFile, readdir } from "fs/promises";
import { join, extname, basename, dirname, resolve } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

/**
 * 이미지 파일을 WebP 형식으로 변환합니다.
 */
export async function convertToWebP(
  imagePath: string,
  quality: number = 80,
  lossless: boolean = false,
  keepOriginal: boolean = false
): Promise<any> {
  try {
    // 절대 경로로 변환
    const absolutePath = resolve(imagePath);

    // 입력 파일이 존재하는지 확인
    if (!existsSync(absolutePath)) {
      throw new Error(`입력 파일이 존재하지 않습니다: ${absolutePath}`);
    }

    // 이미지 확장자 확인
    const ext = extname(absolutePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) {
      throw new Error(`지원되지 않는 이미지 형식입니다: ${ext}`);
    }

    // 파일 읽기
    const imageBuffer = await readFile(absolutePath);

    // 출력 파일명 생성
    const filename = basename(absolutePath, ext);
    const outputPath = join(dirname(absolutePath), `${filename}.webp`);

    // 변환 옵션 설정
    const options = { quality, lossless };

    // 이미지 변환
    await sharp(imageBuffer).webp(options).toFile(outputPath);

    // 원본 파일 삭제 여부 확인
    if (!keepOriginal) {
      await unlink(absolutePath);
    }

    // 결과 반환
    const [sizeBefore, sizeAfter] = await Promise.all([
      keepOriginal
        ? (await stat(absolutePath)).size
        : (await stat(outputPath)).size,
      (await stat(outputPath)).size,
    ]);

    return {
      success: true,
      input_path: absolutePath,
      output_path: outputPath,
      size_before: sizeBefore,
      size_after: sizeAfter,
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

/**
 * 지정된 디렉토리의 모든 이미지 파일 목록을 반환합니다.
 */
export async function getImageFilesInDirectory(
  directory: string
): Promise<string[]> {
  try {
    const absoluteDir = resolve(directory);
    const files = await readdir(absoluteDir, { withFileTypes: true });

    const imageFiles = files
      .filter((file) => file.isFile())
      .map((file) => file.name)
      .filter((filename) => {
        const ext = extname(filename).toLowerCase();
        return [".png", ".jpg", ".jpeg"].includes(ext);
      })
      .map((filename) => join(absoluteDir, filename));

    return imageFiles;
  } catch (error: any) {
    console.error(`디렉토리 읽기 오류: ${error.message}`);
    return [];
  }
}
