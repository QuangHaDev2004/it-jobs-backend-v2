import { Request, Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";

export const search = async (req: Request, res: Response) => {
  try {
    // console.log(req.query);
    const { language, city, company } = req.query;
    const find: any = {};

    // Search by language
    if (language) find.technologies = language;

    // Search by city
    if (city) {
      const cityDetail = await City.findOne({
        name: city,
      });

      if (!cityDetail) {
        return res.json({
          code: "error",
          message: "Không có công việc vào ở thành phố này!",
          jobs: [],
        });
      }

      const companyIds = await AccountCompany.find({
        city: cityDetail._id,
      }).distinct("_id");

      find.companyId = { $in: companyIds };
    }

    // search by company
    if (company) {
      const companyDetail = await AccountCompany.findOne({
        companyName: company,
      });

      if (!companyDetail) {
        return res.json({
          code: "error",
          message: "Không có công việc vào ở công ty này!",
          jobs: [],
        });
      }

      find.companyId = companyDetail._id;
    }

    const jobs = await Job.find(find)
      .populate({
        path: "companyId", // Tên trường trong model Job
        model: AccountCompany,
        populate: {
          path: "city",
          model: City,
        },
      })
      .sort({
        createdAt: "desc",
      });

    const dataFinal = jobs.map((item) => {
      const company = (item.companyId as any) || {};
      const city = company.city || {};

      return {
        id: item.id,
        title: item.title,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        technologies: item.technologies,
        companyLogo: company.logo || "",
        companyName: company.companyName || "",
        cityName: city.name || "",
      };
    });

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
