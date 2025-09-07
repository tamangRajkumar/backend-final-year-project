import { expressjwt } from "express-jwt";
// process.env.JWT_SECRET || 
export const requireSignin = expressjwt({
  secret: "dskfjjnasnfgh762@#@#dqffsadfsa7hghgh",
  algorithms: ["HS256"],
});