import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import User from "../models/userModel.js";

// Protect routes - mw
const protectMw = asyncHandler(async (req, res, next) => {
  // console.log("protectMw running");
  let token;

  // Read the jwt from the cookie
  token = req.cookies.jwt;

  if (token) {
    // decode the token to extract the user._id
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch (error) {
      console.log(error);
      res.status(401);
      throw new Error(`🔴 Unauthorized - Token failed!`);
    }
  } else {
    res.status(401);
    throw new Error("🔴 Unauthorized - No token!");
  }
});

// Admin - mw
const adminMw = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error("🔴 Not authorized as ADMIN!");
  }
};

// export
export { protectMw, adminMw };
