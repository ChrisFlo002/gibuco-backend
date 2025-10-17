import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

export const agent = (req, res, next) => {
  if (req.user && (req.user.role === "Agent" || req.user.role === "Admin")) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

export const driver = (req, res, next) => {
  if (req.user && req.user.role === "Driver") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

export const client = (req, res, next) => {
  if (req.user && req.user.role === "Client") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

