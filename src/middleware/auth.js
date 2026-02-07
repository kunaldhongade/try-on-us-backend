import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
// Middleware to protect routes and require a valid Clerk session
export const requireAuth = ClerkExpressWithAuth({});
export const handleAuthError = (err, req, res, next) => {
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
//# sourceMappingURL=auth.js.map