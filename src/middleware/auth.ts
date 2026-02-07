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
  // Only handle specific Clerk/Auth errors here if possible,
  // or let the global handler handle it.
  if (err.status === 401 || err.name === "ClerkError") {
    console.error("Clerk Auth Error:", err.message);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or missing session" });
  }
  next(err);
};
