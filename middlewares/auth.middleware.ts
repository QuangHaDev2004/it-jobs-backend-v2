import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AccountRequest } from "../interfaces/request.interface";
import AccountUser from "../models/account-user.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";

export const verifyTokenUser = async (
  req: AccountRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        code: "error",
        message: "Token không hợp lệ!",
      });
    }

    const decoded = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`
    ) as jwt.JwtPayload;
    const { id, email } = decoded;

    const existAccount = await AccountUser.findOne({
      _id: id,
      email: email,
    });

    if (!existAccount) {
      res.clearCookie("token");
      return res.status(401).json({
        code: "error",
        message: "Token không hợp lệ!",
      });
    }

    req.account = existAccount;

    next();
  } catch (error) {
    res.clearCookie("token");
    return res.status(500).json({
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
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({
        code: "error",
        message: "Token không hợp lệ!",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`
    ) as jwt.JwtPayload;
    const { id, email } = decoded;

    const existAccount = await AccountCompany.findOne({
      _id: id,
      email: email,
    });

    if (!existAccount) {
      res.clearCookie("token");
      res.status(401).json({
        code: "error",
        message: "Token không hợp lệ!",
      });
      return;
    }

    req.account = existAccount;
    if (existAccount.city) {
      const city = await City.findOne({
        _id: existAccount.city,
      });

      if (city) req.account.cityName = city.name;
    }

    next();
  } catch (error) {
    res.clearCookie("token");
    return res.status(500).json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};
