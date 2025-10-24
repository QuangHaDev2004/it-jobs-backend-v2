import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountUser from "../models/account-user.model";
import AccountCompany from "../models/account-company.model";

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      code: "error",
      message: "Không tìm thấy refresh token trong cookie!",
    });
    return;
  }

  try {
    var decoded = jwt.verify(
      refreshToken,
      `${process.env.REFRESH_TOKEN_SECRET}`
    ) as jwt.JwtPayload;
    const { id, email } = decoded;

    const newAccessToken = jwt.sign(
      {
        id,
        email,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      {
        expiresIn: "15m", // 15 phút
      }
    );

    res.json({
      code: "success",
      message: "Tạo token mới thành công!",
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.clearCookie("refreshToken");
    res.status(401).json({
      code: "error",
      message: "Refresh token không hợp lệ!",
    });
  }
};

export const check = async (req: Request, res: Response) => {
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

    const existAccountUser = await AccountUser.findOne({
      _id: id,
      email: email,
    });

    if (existAccountUser) {
      const infoUser = {
        id: existAccountUser.id,
        fullName: existAccountUser.fullName,
        email: existAccountUser.email,
        phone: existAccountUser.phone,
        avatar: existAccountUser.avatar,
      };

      res.json({
        code: "success",
        message: "Thông tin tài khoản user!",
        infoUser: infoUser,
      });
      return;
    }

    const existAccountCompany = await AccountCompany.findOne({
      _id: id,
      email: email,
    });

    if (existAccountCompany) {
      const infoCompany = {
        id: existAccountCompany.id,
        email: existAccountCompany.email,
        companyName: existAccountCompany.companyName,
        phone: existAccountCompany.phone,
        city: existAccountCompany.city,
        address: existAccountCompany.address,
        companyModel: existAccountCompany.companyModel,
        companyEmployees: existAccountCompany.companyEmployees,
        workingTime: existAccountCompany.workingTime,
        workOverTime: existAccountCompany.workOverTime,
        logo: existAccountCompany.logo,
        description: existAccountCompany.description,
      };

      res.json({
        code: "success",
        message: "Thông tin tài khoản company!",
        infoCompany: infoCompany,
      });
      return;
    }

    if (!existAccountUser && !existAccountCompany) {
      res.status(401).json({
        code: "error",
        message: "Không tìm thấy tài khoản!",
      });
    }
  } catch (error) {
    res.status(401).json({
      code: "error",
      message: "Token không hợp lệ!",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.json({
    code: "success",
    message: "Đã đăng xuất!",
  });
};
