import { Response } from "express";
import { AccountRequest } from "../interfaces/request.interface";
import SaveJob from "../models/save-job.model";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";

export const saveJob = async (req: AccountRequest, res: Response) => {
  try {
    const userId = req.account.id;
    const jobId = req.params.id;

    const newRecord = new SaveJob({ userId, jobId });
    await newRecord.save();

    res.status(201).json({ message: "Lưu công việc thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const list = async (req: AccountRequest, res: Response) => {
  try {
    const userId = req.account.id;

    const saveJobs = await SaveJob.find({
      userId: userId,
    });

    const dataFinal = [];
    for (const item of saveJobs) {
      const jobDetail = await Job.findOne({
        _id: item.jobId,
      });

      const companyDetail = await AccountCompany.findOne({
        _id: jobDetail?.companyId,
      });

      const city = await City.findOne({
        _id: companyDetail?.city,
      });

      if (jobDetail && companyDetail) {
        const itemFinal = {
          id: item.id,
          userId: item.userId,
          jobId: item.jobId,
          title: jobDetail.title,
          salaryMin: jobDetail.salaryMin,
          salaryMax: jobDetail.salaryMax,
          position: jobDetail.position,
          workingForm: jobDetail.workingForm,
          companyName: companyDetail.companyName,
          cityName: city?.name,
        };

        dataFinal.push(itemFinal);
      }
    }

    res.status(200).json({
      message: "Danh sách việc làm đã lưu!",
      saveJobs: dataFinal,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const unSaveJob = async (req: AccountRequest, res: Response) => {
  try {
    const userId = req.account.id;
    const jobId = req.params.id;

    await SaveJob.deleteOne({
      userId: userId,
      jobId: jobId,
    });

    res.status(200).json({
      message: "Đã bỏ lưu công việc!",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
