import { client } from "@gradio/client";
import dotenv from "dotenv";
import { prepareImage } from "../utils/image.utils.js";
import { uploadToS3 } from "../utils/s3.js";

dotenv.config();

/**
 * HF_TOKEN should be your READ or WRITE token from Hugging Face Settings.
 */
const HF_TOKEN = process.env.HF_TOKEN;

/**
 * AI_URL can be:
 * 1. A local/Docker endpoint: "http://localhost:7860"
 * 2. A remote Hugging Face Space: "yisol/IDM-VTON"
 */
const AI_URL = process.env.LOCAL_AI_URL || "yisol/IDM-VTON";
const IS_REMOTE = !AI_URL.startsWith("http");

export interface AIResponse {
  imageUrl: string;
  status: "done" | "failed";
}

export const runVirtualTryOn = async (
  personImage: Buffer,
  garmentImageUrl: string,
  garmentDescription: string,
): Promise<AIResponse> => {
  try {
    const targetUrl = AI_URL;
    console.log(
      `Starting AI Pipeline (Target: ${targetUrl}, Authenticated: ${HF_TOKEN ? "YES" : "NO"})...`,
    );

    // Stage 1: Preprocessing Person Image
    const processedPerson = await prepareImage(personImage);
    const personBlob = new Blob([new Uint8Array(processedPerson)], {
      type: "image/png",
    });

    // Stage 2: Downloading and preparing Garment Image
    const fullGarmentUrl = garmentImageUrl.startsWith("//")
      ? `https:${garmentImageUrl}`
      : garmentImageUrl;
    console.log(`Downloading garment image from: ${fullGarmentUrl}`);
    const garmentResponse = await fetch(fullGarmentUrl);

    if (!garmentResponse.ok) {
      throw new Error(
        `Failed to download garment image: ${garmentResponse.statusText}`,
      );
    }

    const garmentArrayBuffer = await garmentResponse.arrayBuffer();
    const garmentBlob = new Blob([new Uint8Array(garmentArrayBuffer)], {
      type: "image/png",
    });

    // Stage 3: Connect to AI Model
    console.log(`Connecting to AI: ${targetUrl}...`);
    let app;
    try {
      // THE DEFINITIVE FIX FROM OFFICIAL DOCS:
      // 1. Use the 'client' factory function.
      // 2. Use the 'token' key (NOT 'hf_token').
      // 3. Pass the raw token string (no 'Bearer' prefix).
      const rawToken = HF_TOKEN
        ? HF_TOKEN.replace("Bearer ", "").trim()
        : undefined;

      app = await client(targetUrl, {
        token: IS_REMOTE ? (rawToken as any) : undefined,
      });
    } catch (connError: any) {
      console.error("Connection failed:", connError.message || connError);
      throw new Error("AI Service Not Ready (Connection Error)");
    }

    // Stage 4: Inference
    console.log(
      `Calling ${IS_REMOTE ? "Remote Hub" : "Local Docker"} AI 'tryon' endpoint...`,
    );

    const result: any = await app.predict("/tryon", [
      {
        background: personBlob,
        layers: [],
        composite: null,
      },
      garmentBlob,
      garmentDescription,
      true, // is_checked (auto-crop)
      true, // is_checked_crop (resizing)
      30, // denoise_steps
      42, // seed
    ]);

    console.log("AI Result received.");

    if (!result.data || !result.data[0]) {
      console.error("AI result empty:", JSON.stringify(result, null, 2));
      throw new Error("No output image from AI");
    }

    const outputData = result.data[0];
    let resultBuffer: Buffer;
    const outputUrl = outputData.url || outputData.path;

    if (outputUrl) {
      console.log(`Downloading result from: ${outputUrl}`);
      // If it's a relative path from a space, we need to handle it.
      // Most latest clients return full URLs, but we add a check for safety.
      const finalDownloadUrl =
        IS_REMOTE && outputUrl.startsWith("/")
          ? `https://${targetUrl.replace("/", "-")}.hf.space/file=${outputUrl}`
          : outputUrl;

      const response = await fetch(finalDownloadUrl);
      const arrayBuffer = await response.arrayBuffer();
      resultBuffer = Buffer.from(arrayBuffer);
    } else if (outputData instanceof Blob) {
      const arrayBuffer = await outputData.arrayBuffer();
      resultBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error("Unexpected result format from AI");
    }

    console.log("Uploading result to S3/Cloud...");
    const resultUrl = await uploadToS3(
      resultBuffer,
      `tryon-${Date.now()}.png`,
      "image/png",
    );

    return { imageUrl: resultUrl, status: "done" };
  } catch (error: any) {
    console.error("AI Pipeline Error:", error.message || error);
    return { imageUrl: "", status: "failed" };
  }
};
