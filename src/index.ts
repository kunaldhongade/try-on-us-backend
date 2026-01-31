import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import express from "express";
import connectDB from "./config/db.js";
import TryOn from "./models/TryOn.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("TryOnUs Production Backend is running!");
});

import { runVirtualTryOn } from "./services/ai.service.js";

app.post("/tryon", async (req: Request, res: Response) => {
  const { productId, variantId, shop, originalImageUrl, personImageBase64 } =
    req.body;

  // Note: Once Clerk is fully set up on frontend, we will use req.auth.userId
  const clerkUserId = "guest_for_testing";

  try {
    // Create a record in MongoDB
    const tryonEntry = await TryOn.create({
      clerkUserId,
      productId,
      variantId,
      shop,
      originalImageUrl:
        originalImageUrl || "https://example.com/placeholder.jpg",
      status: "processing",
    });

    console.log(`TryOn started for: ${tryonEntry._id}`);

    // Run AI Pipeline asynchronously
    (async () => {
      try {
        const personBuffer = personImageBase64
          ? Buffer.from(personImageBase64, "base64")
          : Buffer.alloc(0);

        const result = await runVirtualTryOn(
          personBuffer,
          tryonEntry.originalImageUrl,
        );

        tryonEntry.status = result.status === "done" ? "done" : "failed";
        tryonEntry.resultImageUrl = result.imageUrl;
        await tryonEntry.save();

        console.log(`TryOn ${tryonEntry.status} for: ${tryonEntry._id}`);
      } catch (err) {
        console.error("AI execution failed:", err);
      }
    })();

    // Immediate response with processing ID
    res.json({
      status: "processing",
      id: tryonEntry._id,
      message: "Processing started. Results will be available shortly.",
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
      ], // Mock initial image
    });
  } catch (error) {
    console.error("TryOn Error:", error);
    res.status(500).json({ error: "Failed to process try-on" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
