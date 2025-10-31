import { Request, Response } from "express";
import AccountCompany from "../models/account-company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AccountRequest } from "../interfaces/request.interface";
import Job from "../models/job.model";
import City from "../models/city.model";

export const registerPost = async (req: Request, res: Response) => {
  const existAccount = await AccountCompany.findOne({
    email: req.body.email,
  });

  if (existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!",
    });
    return;
  }

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  const newAccount = new AccountCompany(req.body);
  await newAccount.save();

  res.json({
    code: "success",
    message: "Đăng ký tài khoản thành công!",
  });
};

export const loginPost = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existAccount = await AccountCompany.findOne({
    email: email,
  });

  if (!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thống!",
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    `${existAccount.password}`
  );

  if (!isPasswordValid) {
    res.json({
      code: "error",
      message: "Sai mật khẩu!",
    });
    return;
  }

  // sign 3 tham số: thông tin muốn mã hóa, mã bảo mật, thời gian lưu
  const accessToken = jwt.sign(
    {
      id: existAccount.id,
      email: existAccount.email,
    },
    `${process.env.ACCESS_TOKEN_SECRET}`,
    {
      expiresIn: "15m", // 15 phút
    }
  );

  const refreshToken = jwt.sign(
    {
      id: existAccount.id,
      email: existAccount.email,
    },
    `${process.env.REFRESH_TOKEN_SECRET}`,
    {
      expiresIn: "7d", // 7 ngày
    }
  );

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // production (https) = true, dev (htttp) = false
    sameSite: "lax", // Cho phép gửi cookie giữa các tên miền
  });

  res.json({
    code: "success",
    message: "Đăng nhập thành công!",
    accessToken: accessToken,
  });
};

export const profilePatch = async (req: AccountRequest, res: Response) => {
  try {
    if (req.file) {
      req.body.logo = req.file.path;
    } else {
      delete req.body.logo;
    }

    await AccountCompany.updateOne(
      {
        _id: req.account.id,
      },
      req.body
    );

    res.json({
      code: "success",
      message: "Cập nhật thành công!",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Cập nhật thất bại!",
    });
  }
};

export const createJobPost = async (req: AccountRequest, res: Response) => {
  try {
    req.body.companyId = req.account.id;
    req.body.salaryMin = req.body.salaryMin ? parseInt(req.body.salaryMin) : 0;
    req.body.salaryMax = req.body.salaryMax ? parseInt(req.body.salaryMax) : 0;
    req.body.technologies = req.body.technologies
      ? JSON.parse(req.body.technologies)
      : [];

    // Xử lý hình ảnh
    req.body.images = [];
    if (req.files) {
      for (const file of req.files as any[]) {
        req.body.images.push(file.path);
      }
    }

    const newRecord = new Job(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo công việc thành công!",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const listJob = async (req: AccountRequest, res: Response) => {
  try {
    const companyId = req.account.id;

    const find = {
      companyId: companyId,
    };

    // Phân trang
    const limitItems = 3;
    let page = 1;
    if (req.query.page && parseInt(req.query.page as string) > 0) {
      page = parseInt(req.query.page as string);
    }
    const skip = (page - 1) * limitItems;
    const totalRecord = await Job.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);

    const jobs = await Job.find(find)
      .sort({
        createdAt: "desc",
      })
      .limit(limitItems)
      .skip(skip);

    const dataFinal = [];
    for (const item of jobs) {
      dataFinal.push({
        id: item.id,
        companyLogo: req.account.logo,
        title: item.title,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        companyCity: req.account.companyCity,
        technologies: item.technologies,
      });
    }

    res.json({
      code: "success",
      message: "Thành công!",
      jobs: dataFinal,
      totalPage: totalPage,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const editJob = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;
    const companyId = req.account.id;

    const jobDetail = await Job.findOne({
      _id: id,
      companyId: companyId,
    });

    if (!jobDetail) {
      res.json({
        code: "error",
        message: "Dữ liệu không hợp lệ!",
      });
      return;
    }

    res.json({
      code: "success",
      message: "Lấy dữ liệu thành công!",
      jobDetail: jobDetail,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const editJobPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;
    const companyId = req.account.id;

    const jobDetail = await Job.findOne({
      _id: id,
      companyId: companyId,
    });

    if (!jobDetail) {
      res.json({
        code: "error",
        message: "Dữ liệu không hợp lệ!",
      });
      return;
    }

    req.body.salaryMin = req.body.salaryMin ? parseInt(req.body.salaryMin) : 0;
    req.body.salaryMax = req.body.salaryMax ? parseInt(req.body.salaryMax) : 0;
    req.body.technologies = req.body.technologies
      ? JSON.parse(req.body.technologies)
      : [];

    // Xử lý hình ảnh
    req.body.images = req.body.images
      ? Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images]
      : [];
    if (req.files) {
      for (const file of req.files as any[]) {
        req.body.images.push(file.path);
      }
    }

    await Job.updateOne(
      {
        _id: id,
        companyId: companyId,
      },
      req.body
    );

    res.json({
      code: "success",
      message: "Cập nhật thành công!",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const deleteJobDel = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;
    const companyId = req.account.id;

    const jobDetail = await Job.findOne({
      _id: id,
      companyId: companyId,
    });

    if (!jobDetail) {
      res.json({
        code: "error",
        message: "Dữ liệu không hợp lệ!",
      });
      return;
    }

    await Job.deleteOne({
      _id: id,
      companyId: companyId,
    });

    res.json({
      code: "success",
      message: "Đã xóa công việc!",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const list = async (req: Request, res: Response) => {
  let limitItems = 12;
  if (req.query.limitItems) {
    limitItems = parseInt(req.query.limitItems as string);
  }

  const companyList = await AccountCompany.find({}).limit(limitItems);

  const companyListFinal = [];
  for (const item of companyList) {
    const dataItem = {
      id: item.id,
      logo: item.logo,
      companyName: item.companyName,
      cityName: "",
      totalJob: 0,
    };

    const city = await City.findOne({
      _id: item.city,
    });
    dataItem.cityName = city ? (city?.name as string) : "";

    const totalJob = await Job.countDocuments({
      companyId: item.id,
    });
    dataItem.totalJob = totalJob ? totalJob : 0;

    companyListFinal.push(dataItem);
  }

  res.json({
    code: "success",
    message: "Lấy dữ liệu thành công!",
    companyList: companyListFinal,
  });
};
