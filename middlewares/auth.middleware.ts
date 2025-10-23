import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AccountRequest } from "../interfaces/request.interface";
import AccountUser from "../models/account-user.model";
import AccountCompany from "../models/account-company.model";

export const verifyTokenUser = async (
  req: AccountRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      res.status(401).json({
        code: "error",
        message: "Không có access token!",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      `${process.env.ACCESS_TOKEN_SECRET}`
    ) as jwt.JwtPayload;
    const { id, email } = decoded;

    const existAccount = await AccountUser.findOne({
      _id: id,
      email: email,
    });

    if (!existAccount) {
      res.status(401).json({
        code: "error",
        message: "Access token không hợp lệ!",
      });
      return;
    }

    req.account = existAccount;

    next();
  } catch (error) {
    res.status(401).json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const verifyTokenCompany = async (
  req: AccountRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      res.status(401).json({
        code: "error",
        message: "Không có access token!",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      `${process.env.ACCESS_TOKEN_SECRET}`
    ) as jwt.JwtPayload;
    const { id, email } = decoded;

    const existAccount = await AccountCompany.findOne({
      _id: id,
      email: email,
    });

    if (!existAccount) {
      res.status(401).json({
        code: "error",
        message: "Access token không hợp lệ!",
      });
      return;
    }

    req.account = existAccount;

    next();
  } catch (error) {
    res.status(401).json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};
