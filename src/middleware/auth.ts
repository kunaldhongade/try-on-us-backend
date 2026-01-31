import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import type { Handler, NextFunction, Request, Response } from "express";

// Middleware to protect routes and require a valid Clerk session
export const requireAuth: any = ClerkExpressWithAuth({});

export const handleAuthError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Clerk Auth Error:", err.message);
  res.status(401).json({ error: "Unauthorized: Invalid or missing session" });
};
