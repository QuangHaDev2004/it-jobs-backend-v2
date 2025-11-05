import { Request, Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";

export const search = async (req: Request, res: Response) => {
  try {
    console.log(req.query.language);
    const dataFinal = [];

    if (Object.keys(req.query).length > 0) {
      const find: any = {};

      // Kỹ năng - Ngôn ngữ
      if (req.query.language) {
        find.technologies = req.query.language;
      }

      const jobs = await Job.find(find);

      for (const item of jobs) {
        const itemFinal = {
          id: item.id,
          companyLogo: "",
          title: item.title,
          companyName: "",
          salaryMin: item.salaryMin,
          salaryMax: item.salaryMax,
          position: item.position,
          workingForm: item.workingForm,
          cityName: "",
          technologies: item.technologies,
        };

        const companyInfo = await AccountCompany.findOne({
          _id: item.companyId,
        });

        if (companyInfo) {
          itemFinal.companyLogo = companyInfo.logo as string;
          itemFinal.companyName = companyInfo.companyName as string;

          const city = await City.findOne({
            _id: companyInfo.city,
          });

          itemFinal.cityName = city?.name as string;

          dataFinal.push(itemFinal);
        }
      }
    }

    res.json({
      code: "success",
      message: "Lấy danh sách công việc thành công!",
      jobs: dataFinal,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi lấy danh sách công việc!",
    });
  }
};
