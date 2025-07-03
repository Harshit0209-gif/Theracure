import fs from "fs/promises";
import path from "path";

export const getImagesAsBase64 = async (fileNames: string[] = []) => {
  const imagesBase64: { [key: string]: string | null } = {};

  for (const fileName of fileNames) {
    try {
      const filePath = path.resolve(process.cwd(), "public", fileName);
      const imageBuffer = await fs.readFile(filePath);

      const ext = path.extname(fileName).toLowerCase();
      let mimeType = "image/png";

      switch (ext) {
        case ".jpg":
        case ".jpeg":
          mimeType = "image/jpeg";
          break;
        case ".png":
          mimeType = "image/png";
          break;
        case ".svg":
          mimeType = "image/svg+xml";
          break;
        case ".gif":
          mimeType = "image/gif";
          break;
      }

      const base64String = imageBuffer.toString("base64");
      imagesBase64[fileName] = `data:${mimeType};base64,${base64String}`;

      console.log(` Loaded image: ${fileName}`);
    } catch (error) {
      console.warn(`Could not load image: ${fileName}`, error);
      imagesBase64[fileName] = null;
    }
  }

  return imagesBase64;
};
