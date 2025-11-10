import { Request, Response } from "express";
import AccountCompany from "../models/account-company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AccountRequest } from "../interfaces/request.interface";
import Job from "../models/job.model";
import City from "../models/city.model";
import slugify from "slugify";
import CV from "../models/cv.model";

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

    req.body.search = slugify(
      `${req.body.title} ${req.body.position} ${req.body.technologies.join(
        " "
      )}`,
      {
        replacement: " ",
        lower: true,
        strict: true,
      }
    );

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

    req.body.search = slugify(
      `${req.body.title} ${req.body.position} ${req.body.technologies.join(
        " "
      )}`,
      {
        replacement: " ",
        lower: true,
        strict: true,
      }
    );

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

export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await AccountCompany.findOne({
      _id: id,
    });

    if (!record) {
      return res.status(404).json({
        code: "error",
        message: "Không tìm thấy thông tin công ty!",
      });
    }

    const companyDetail = {
      id: record.id,
      logo: record.logo,
      companyName: record.companyName,
      address: record.address,
      companyModel: record.companyModel,
      companyEmployees: record.companyEmployees,
      workingTime: record.workingTime,
      workOverTime: record.workOverTime,
      description: record.description,
    };

    // List Job
    const jobs = await Job.find({
      companyId: record._id,
    }).sort({
      createAt: "desc",
    });

    const city = await City.findOne({
      _id: record.city,
    });

    const dataFinal = jobs.map((item) => {
      return {
        id: item.id,
        companyLogo: record.logo,
        title: item.title,
        companyName: record.companyName,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        cityName: city?.name,
        technologies: item.technologies,
      };
    });

    res.status(200).json({
      code: "success",
      message: "Lấy dữ liệu chi tiết công ty thành công!",
      companyDetail,
      jobs: dataFinal,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const listCV = async (req: AccountRequest, res: Response) => {
  try {
    const companyId = req.account.id;

    const jobListId = await Job.find({
      companyId: companyId,
    }).distinct("_id");

    const cvs = await CV.find({
      jobId: { $in: jobListId },
    })
      .populate({
        path: "jobId",
      })
      .sort({
        createAt: "desc",
      });

    const dataFinal = cvs.map((cv) => {
      const jobDetail = cv.jobId as any;

      return {
        id: cv.id,
        title: jobDetail.title,
        fullName: cv.fullName,
        email: cv.email,
        phone: cv.phone,
        salaryMin: jobDetail.salaryMin,
        salaryMax: jobDetail.salaryMax,
        position: jobDetail.position,
        workingForm: jobDetail.workingForm,
        viewed: cv.viewed,
        status: cv.status,
      };
    });

    res.status(200).json({
      code: "success",
      message: "Lấy dữ liệu danh sách CV thành công!",
      cvs: dataFinal,
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const detailCV = async (req: AccountRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.account.id;

    const infoCV = await CV.findOne({
      _id: id,
    });

    if (!infoCV) {
      return res.status(404).json({
        code: "error",
        message: "Không tìm thấy thông tin CV!",
      });
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId,
    });

    if (!infoJob) {
      return res.status(404).json({
        code: "error",
        message: "Không tìm thấy thông tin công việc!",
      });
    }

    const dataFinalCV = {
      fullName: infoCV.fullName,
      email: infoCV.email,
      phone: infoCV.phone,
      fileCV: infoCV.fileCV,
    };

    const dataFinalJob = {
      id: infoJob.id,
      title: infoJob.title,
      salaryMin: infoJob.salaryMin,
      salaryMax: infoJob.salaryMax,
      position: infoJob.position,
      workingForm: infoJob.workingForm,
      technologies: infoJob.technologies,
    };

    res.status(200).json({
      code: "success",
      message: "Lấy dữ liệu chi tiết CV thành công!",
      cvDetail: dataFinalCV,
      jobDetail: dataFinalJob,
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};
