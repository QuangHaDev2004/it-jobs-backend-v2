import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      code: "error",
      message: "Không có access token!",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    var decoded = jwt.verify(
      token,
      `${process.env.ACCESS_TOKEN_SECRET}`
    ) as jwt.JwtPayload;
    (req as any).decoded = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      code: "error",
      message: "Access token không hợp lệ!",
    });
  }
};
