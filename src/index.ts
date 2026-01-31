import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("TryOnUs Backend is running!");
});

app.post("/tryon", (req: Request, res: Response) => {
  const { productId, variantId, shop } = req.body;

  console.log(`Received TryOn request for:
    Product: ${productId}
    Variant: ${variantId}
    Shop: ${shop}`);

  // Simulating AI processing delay
  setTimeout(() => {
    res.json({
      status: "done",
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
      ],
    });
  }, 2000);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
