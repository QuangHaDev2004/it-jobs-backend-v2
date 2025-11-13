import { Request, Response } from "express";
import AccountUser from "../models/account-user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AccountRequest } from "../interfaces/request.interface";
import Job from "../models/job.model";
import CV from "../models/cv.model";
import AccountCompany from "../models/account-company.model";

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountUser.findOne({
      email: req.body.email,
    });

    if (existAccount) {
      return res
        .status(409)
        .json({ message: "Email đã tồn tại trong hệ thống!" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    const newAccount = new AccountUser(req.body);
    await newAccount.save();

    res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existAccount = await AccountUser.findOne({
      email: email,
    });

    if (!existAccount) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống!" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      `${existAccount.password}`
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Sai mật khẩu!" });
    }

    // sign 3 tham số: thông tin muốn mã hóa, mã bảo mật, thời gian lưu
    const token = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // production (https) = true, dev (htttp) = false
      sameSite: "lax", // Cho phép gửi cookie giữa các tên miền
    });

    res.status(200).json({ message: "Đăng nhập thành công!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const profilePatch = async (req: AccountRequest, res: Response) => {
  try {
    const userId = req.account.id;

    if (req.file) {
      req.body.avatar = req.file.path;
    } else {
      delete req.body.avatar;
    }

    await AccountUser.updateOne(
      {
        _id: userId,
      },
      req.body
    );

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const listCV = async (req: AccountRequest, res: Response) => {
  try {
    const email = req.account.email;

    const cvs = await CV.find({
      email: email,
    }).sort({
      createdAt: "desc",
    });

    const dataFinal = [];
    for (const item of cvs) {
      const jobDetail = await Job.findOne({
        _id: item.jobId,
      });

      const companyDetail = await AccountCompany.findOne({
        _id: jobDetail?.companyId,
      });

      if (jobDetail && companyDetail) {
        const itemFinal = {
          id: item.id,
          title: jobDetail.title,
          companyName: companyDetail.companyName,
          salaryMin: jobDetail.salaryMin,
          salaryMax: jobDetail.salaryMax,
          position: jobDetail.position,
          workingForm: jobDetail.workingForm,
          status: item.status,
        };

        dataFinal.push(itemFinal);
      }
    }

    res.status(200).json({
      message: "Lấy dữ liệu danh sách CV thành công!",
      cvs: dataFinal,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
