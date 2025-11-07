import { Request, Response } from "express";
import Job from "../models/job.model";

export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await Job.findOne({
      _id: id,
    }).populate("companyId");

    if (!record) {
      return res.json({
        code: "error",
        message: "Có lỗi khi lấy dữ liệu!",
      });
    }

    const company = record.companyId as any;

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
      companyId: company.id,
      address: company.address,
      companyName: company.companyName,
      companyLogo: company.logo,
      companyModel: company.companyModel,
      companyEmployees: company.companyEmployees,
      workingTime: company.workingTime,
      workOverTime: company.workOverTime,
    };

    res.json({
      code: "success",
      message: "Lấy thông tin chi tiết job thành công!",
      jobDetail,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Có lỗi khi lấy dữ liệu!",
    });
  }
};
