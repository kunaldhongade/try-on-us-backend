import sharp from "sharp";

export const prepareImage = async (input: Buffer): Promise<Buffer> => {
  // Resize to a standard 512x512 for most diffusion models or 768x1024 for VTON
  return await sharp(input)
    .resize(768, 1024, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();
};

export const createMask = async (input: Buffer): Promise<Buffer> => {
  // This is a placeholder for real segmentation.
  // In a real production app, you'd use a model like SAM or a dedicated human parser.
  // For now, we return a blank mask to satisfy the API structure.
  const metadata = await sharp(input).metadata();
  return await sharp({
    create: {
      width: metadata.width || 768,
      height: metadata.height || 1024,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();
};
