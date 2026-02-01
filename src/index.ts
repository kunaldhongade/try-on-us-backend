import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import express from "express";
import connectDB from "./config/db.js";
import TryOn from "./models/TryOn.js";
import User from "./models/User.js";

dotenv.config();

const REQUIRED_ENV = [
  "MONGODB_URI",
  "CLERK_SECRET_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET_NAME",
  "HF_TOKEN",
];

const missingEnv = REQUIRED_ENV.filter(
  (env) => !process.env[env] || process.env[env]?.includes("..."),
);
if (missingEnv.length > 0) {
  console.warn(
    `\x1b[33mWarning: Missing or placeholder environment variables: ${missingEnv.join(", ")}\x1b[0m`,
  );
  console.warn(
    `\x1b[33mThe system will use mock data for these services until real keys are provided in .env\x1b[0m`,
  );
}

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(
  cors({
    origin: "*",
    allowedHeaders: [
      "Content-Type",
      "ngrok-skip-browser-warning",
      "Authorization",
    ],
    methods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(express.json());

// Debug logger
app.use((req, res, next) => {
  console.log(
    `\x1b[36m[${new Date().toISOString()}] ${req.method} ${req.url}\x1b[0m`,
  );
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("TryOnUs Production Backend is running!");
});

import { handleAuthError, requireAuth } from "./middleware/auth.js";
import { runVirtualTryOn } from "./services/ai.service.js";

app.post("/tryon", requireAuth, async (req: any, res: Response) => {
  const {
    productId,
    variantId,
    shop,
    originalImageUrl,
    productTitle,
    personImageBase64,
  } = req.body;

  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Ensure User exists and update their data
    let user = await User.findOne({ clerkUserId });
    if (!user) {
      user = await User.create({ clerkUserId });
    }

    // 2. Create the TryOn record linked to the user
    const tryonEntry = await TryOn.create({
      clerkUserId,
      userId: user._id,
      productId,
      variantId,
      shop,
      originalImageUrl:
        originalImageUrl || "https://example.com/placeholder.jpg",
      status: "processing",
    });

    // 3. Link TryOn to User's history and save person image if provided
    user.tryOns.push(tryonEntry._id as any);
    if (originalImageUrl && !user.personImages.includes(originalImageUrl)) {
      user.personImages.push(originalImageUrl);
    }
    await user.save();

    console.log(
      `TryOn started for user ${user.clerkUserId}: ${tryonEntry._id}`,
    );

    // Run AI Pipeline asynchronously
    (async () => {
      try {
        const personBuffer = personImageBase64
          ? Buffer.from(personImageBase64, "base64")
          : Buffer.alloc(0);

        const result = await runVirtualTryOn(
          personBuffer,
          tryonEntry.originalImageUrl,
          productTitle || "garment",
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
      images: [tryonEntry.originalImageUrl],
    });
  } catch (error) {
    console.error("TryOn Error:", error);
    res.status(500).json({ error: "Failed to process try-on" });
  }
});

app.get("/tryon-status/:id", async (req: Request, res: Response) => {
  try {
    const tryonEntry = await TryOn.findById(req.params.id);
    if (!tryonEntry) {
      return res.status(404).json({ error: "TryOn not found" });
    }
    res.json({
      status: tryonEntry.status,
      resultImageUrl: tryonEntry.resultImageUrl,
      images: tryonEntry.resultImageUrl ? [tryonEntry.resultImageUrl] : [],
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

app.use(handleAuthError);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
