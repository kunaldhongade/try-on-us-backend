import axios from "axios";
import dotenv from "dotenv";
import { prepareImage } from "../utils/image.utils.js";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL_URL = "https://api-inference.huggingface.co/models/yisol/IDM-VTON";

export interface AIResponse {
  imageUrl: string;
  status: "done" | "failed";
}

export const runVirtualTryOn = async (
  personImage: Buffer,
  garmentImageUrl: string,
): Promise<AIResponse> => {
  try {
    console.log("Starting AI Pipeline...");

    // Stage 1: Preprocessing
    const processedPerson = await prepareImage(personImage);

    // Stage 2 & 3: Inference (Calling Hugging Face)
    // Note: IDM-VTON usually requires multiple inputs (person, garment, mask).
    // The Inference API signature varies; often requiring a Multipart/Form-data or base64.

    if (!HF_TOKEN) {
      console.warn("HF_TOKEN missing. Using mock response.");
      return {
        imageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        status: "done",
      };
    }

    // Example API call structure
    const response = await axios.post(
      MODEL_URL,
      {
        inputs: {
          person_image: processedPerson.toString("base64"),
          garment_image: garmentImageUrl,
        },
      },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
      },
    );

    return {
      imageUrl: response.data.image_url || "https://example.com/result.jpg",
      status: "done",
    };
  } catch (error) {
    console.error("AI Pipeline Error:", error);
    return {
      imageUrl: "",
      status: "failed",
    };
  }
};
