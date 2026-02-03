import axios from "axios";
import dotenv from "dotenv";
import { GoogleAuth } from "google-auth-library";
import { prepareImage } from "../utils/image.utils.js";
import { uploadToS3 } from "../utils/s3.js";

dotenv.config();

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || "us-central1";

export interface AIResponse {
  imageUrl: string;
  status: "done" | "failed";
}

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});

export const runVirtualTryOn = async (
  personImage: Buffer,
  garmentImageUrl: string,
  garmentDescription: string,
): Promise<AIResponse> => {
  try {
    if (!PROJECT_ID) {
      throw new Error("GCP_PROJECT_ID is not configured");
    }

    console.log(
      `Starting Vertex AI Pipeline (Project: ${PROJECT_ID}, Location: ${LOCATION})...`,
    );

    // Stage 1: Preprocessing Person Image
    const processedPerson = await prepareImage(personImage);
    const personBase64 = processedPerson.toString("base64");

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
    const garmentBuffer = Buffer.from(garmentArrayBuffer);
    const garmentBase64 = garmentBuffer.toString("base64");

    // Stage 3: Get Auth Token
    console.log(
      "Getting Google Cloud auth token (using Application Default Credentials)...",
    );
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error("Failed to get Google Cloud access token");
    }

    // Stage 4: Call Vertex AI API
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/virtual-try-on-001:predict`;

    const requestBody = {
      instances: [
        {
          personImage: {
            image: {
              bytesBase64Encoded: personBase64,
            },
          },
          productImages: [
            {
              image: {
                bytesBase64Encoded: garmentBase64,
              },
            },
          ],
        },
      ],
      parameters: {
        sampleCount: 1,
      },
    };

    console.log(`Calling Vertex AI: ${url}...`);
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Vertex AI Result received.");

    const predictions = response.data.predictions;
    if (!predictions || !predictions[0] || !predictions[0].bytesBase64Encoded) {
      console.error(
        "Vertex AI result empty or invalid:",
        JSON.stringify(response.data, null, 2),
      );
      throw new Error("No output image from Vertex AI");
    }

    const resultBase64 = predictions[0].bytesBase64Encoded;
    const resultBuffer = Buffer.from(resultBase64, "base64");

    console.log("Uploading result to S3...");
    const resultUrl = await uploadToS3(
      resultBuffer,
      `tryon-${Date.now()}.png`,
      "image/png",
    );

    return { imageUrl: resultUrl, status: "done" };
  } catch (error: any) {
    console.error(
      "AI Pipeline Error:",
      error.response?.data || error.message || error,
    );
    return { imageUrl: "", status: "failed" };
  }
};
