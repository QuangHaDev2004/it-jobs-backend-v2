import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountUser from "../models/account-user.model";

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
    const { id, email } = (req as any).decoded;

    const existAccountUser = await AccountUser.findOne({
      _id: id,
      email: email,
    });

    if (existAccountUser) {
      const infoUser = {
        id: existAccountUser.id,
        fullName: existAccountUser.fullName,
        email: existAccountUser.email,
      };

      res.json({
        code: "success",
        message: "Thông tin tài khoản user!",
        infoUser: infoUser,
      });
      return;
    }

    if (!existAccountUser) {
      res.json({
        code: "error",
        message: "Không tìm thấy tài khoản!",
      });
    }
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi hàm check!",
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
