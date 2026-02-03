import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
// Middleware to protect routes and require a valid Clerk session
export const requireAuth = ClerkExpressWithAuth({});
export const handleAuthError = (err, req, res, next) => {
    console.error("Clerk Auth Error:", err.message);
    res.status(401).json({ error: "Unauthorized: Invalid or missing session" });
};
//# sourceMappingURL=auth.js.map