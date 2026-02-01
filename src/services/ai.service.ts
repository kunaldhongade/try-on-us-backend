import { Client } from "@gradio/client";
import dotenv from "dotenv";
import { prepareImage } from "../utils/image.utils.js";
import { uploadToS3 } from "../utils/s3.js";

dotenv.config();

/**
 * AI_URL is strictly tied to the local Docker 'ai-model' service.
 * This ensures the backend only communicates with the local containerized AI.
 */
const AI_URL = process.env.LOCAL_AI_URL || "http://host.docker.internal:7860";

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
    console.log(`Starting Local AI Pipeline (Endpoint: ${AI_URL})...`);

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

    // Stage 3: Connect to Local Docker AI Model
    console.log(`Connecting to Local Docker AI: ${AI_URL}...`);
    const app = await Client.connect(AI_URL);

    // Stage 4: Inference
    console.log("Calling Local AI 'tryon' endpoint...");

    const result: any = await app.predict("/tryon", {
      dict: {
        background: personBlob,
        layers: [],
        composite: null,
      },
      garm_img: garmentBlob,
      garment_des: garmentDescription,
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    });

    console.log("Local AI Result received.");

    if (!result.data || !result.data[0]) {
      console.error("Local AI result empty:", JSON.stringify(result, null, 2));
      throw new Error("No output image from local AI");
    }

    const outputData = result.data[0];
    let resultBuffer: Buffer;

    const outputUrl = outputData.url || outputData.path;

    if (outputUrl) {
      console.log(`Downloading result from: ${outputUrl}`);
      const response = await fetch(outputUrl);
      const arrayBuffer = await response.arrayBuffer();
      resultBuffer = Buffer.from(arrayBuffer);
    } else if (outputData instanceof Blob) {
      console.log("Result is a Blob, converting to buffer...");
      const arrayBuffer = await outputData.arrayBuffer();
      resultBuffer = Buffer.from(arrayBuffer);
    } else {
      console.error("Unknown output format from local AI:", outputData);
      throw new Error("Unexpected result format from local AI");
    }

    console.log("Uploading result to S3...");
    const resultUrl = await uploadToS3(
      resultBuffer,
      `tryon-${Date.now()}.png`,
      "image/png",
    );

    return {
      imageUrl: resultUrl,
      status: "done",
    };
  } catch (error) {
    console.error("Local AI Pipeline Error:", error);
    return {
      imageUrl: "",
      status: "failed",
    };
  }
};
