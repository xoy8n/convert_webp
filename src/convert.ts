import { unlink, stat, readFile, readdir } from "fs/promises";
import { join, extname, basename, dirname, resolve } from "path";
import sharp from "sharp";

export async function convertToWebP(
  imagePath: string,
  quality: number = 80,
  lossless: boolean = false,
  keepOriginal: boolean = false
): Promise<any> {
  try {
    const ext = extname(imagePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) {
      throw new Error(`지원되지 않는 이미지 형식입니다: ${ext}`);
    }

    const imageBuffer = await readFile(imagePath);
    const filename = basename(imagePath, ext);
    const outputPath = join(dirname(imagePath), `${filename}.webp`);
    const options = { quality, lossless };

    await sharp(imageBuffer).webp(options).toFile(outputPath);

    if (!keepOriginal) {
      await unlink(imagePath);
    }

    const [sizeBefore, sizeAfter] = await Promise.all([
      keepOriginal
        ? (await stat(imagePath)).size
        : (await stat(outputPath)).size,
      (await stat(outputPath)).size,
    ]);

    return {
      success: true,
      input_path: imagePath,
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
