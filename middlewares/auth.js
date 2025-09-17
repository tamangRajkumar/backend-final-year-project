import { expressjwt } from "express-jwt";
import { adminMiddleware } from "./roleAuth.js";

// process.env.JWT_SECRET || 
export const requireSignin = expressjwt({
  secret: "dskfjjnasnfgh762@#@#dqffsadfsa7hghgh",
  algorithms: ["HS256"],
});

// Re-export adminMiddleware for convenience
export { adminMiddleware };