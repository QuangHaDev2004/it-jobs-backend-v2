import { Request, Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";
import slugify from "slugify";

export const search = async (req: Request, res: Response) => {
  try {
    const { language, city, company, position, workingForm, keyword } =
      req.query;
    const dataFinal = [];

    if (Object.keys(req.query).length > 0) {
      const find: any = {};

      if (language) find.technologies = language;

      if (city) {
        const cityDetail = await City.findOne({
          name: city,
        });

        if (!cityDetail) {
          return res.status(404).json({
            message: "Không có công việc vào ở thành phố này!",
            jobs: [],
          });
        }

        const companyIds = await AccountCompany.find({
          city: cityDetail.id,
        }).distinct("_id");

        find.companyId = { $in: companyIds };
      }

      if (company) {
        const companyDetail = await AccountCompany.findOne({
          companyName: company,
        });

        if (!companyDetail) {
          return res.status(404).json({
            message: "Không có công việc vào ở công ty này!",
            jobs: [],
          });
        }

        find.companyId = companyDetail.id;
      }

      if (position) find.position = position;

      if (workingForm) find.workingForm = workingForm;

      if (keyword) {
        const searchKeyword = slugify(`${keyword}`, {
          replacement: " ",
          lower: true,
        });

        const keywordRegex = new RegExp(searchKeyword, "i");
        find.search = keywordRegex;
      }

      const jobs = await Job.find(find).sort({
        createdAt: "desc",
      });

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

    res.status(200).json({
      message: "Danh sách công việc thành công!",
      jobs: dataFinal,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
