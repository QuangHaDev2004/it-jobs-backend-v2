import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountUser from "../models/account-user.model";
import AccountCompany from "../models/account-company.model";

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      code: "error",
      message: "RT không tồn tại!",
    });
  }

  try {
    const decoded = jwt.verify(
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

    res.status(200).json({
      code: "success",
      message: "Tạo token mới thành công!",
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.clearCookie("refreshToken");
    res.status(401).json({
      code: "error",
      message: "Refresh token không hợp lệ hoặc hết hạn!",
    });
  }
};

export const check = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }

    const decoded = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`
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

      return res.status(200).json({
        message: "Thông tin tài khoản user!",
        infoUser: infoUser,
      });
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

      return res.status(200).json({
        message: "Thông tin tài khoản company!",
        infoCompany: infoCompany,
      });
    }

    if (!existAccountUser && !existAccountCompany) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản!",
      });
    }
  } catch (error) {
    res.clearCookie("token");
    return res.status(401).json({
      message: "Token không hợp lệ hoặc hết hạn!",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      code: "success",
      message: "Đã đăng xuất!",
    });
  } catch (error) {
    console.log("Error during logout: ", error);
    return res.status(500).json({
      code: "error",
      message: "Lỗi hệ thống!",
    });
  }
};
