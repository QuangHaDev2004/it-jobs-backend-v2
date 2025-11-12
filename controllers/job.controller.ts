import { Request, Response } from "express";
import Job from "../models/job.model";
import CV from "../models/cv.model";
import AccountCompany from "../models/account-company.model";

export const detail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const record = await Job.findOne({
      _id: id,
    });

    if (!record) {
      return res.status(404).json({ message: "Công việc không tồn tại!" });
    }

    const companyInfo = await AccountCompany.findOne({
      _id: record.companyId,
    });

    if (!companyInfo) {
      return res.status(404).json({ message: "Công ty không tồn tại!" });
    }

    const jobDetail = {
      id: record.id,
      title: record.title,
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      images: record.images,
      position: record.position,
      workingForm: record.workingForm,
      createdAt: record.createdAt,
      technologies: record.technologies,
      description: record.description,
      companyId: companyInfo.id,
      address: companyInfo.address,
      companyName: companyInfo.companyName,
      companyLogo: companyInfo.logo,
      companyModel: companyInfo.companyModel,
      companyEmployees: companyInfo.companyEmployees,
      workingTime: companyInfo.workingTime,
      workOverTime: companyInfo.workOverTime,
    };

    res.status(200).json({
      message: "Lấy thông tin chi tiết job thành công!",
      jobDetail,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const applyPost = async (req: Request, res: Response) => {
  try {
    req.body.fileCV = req.file ? req.file.path : "";

    const newRecord = new CV(req.body);
    await newRecord.save();

    res.status(201).json({
      code: "success",
      message: "Gửi CV ứng tuyển thành công!",
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Có lỗi khi gửi CV!",
    });
  }
};
