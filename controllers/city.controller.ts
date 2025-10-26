import { Request, Response } from "express";
import City from "../models/city.model";

export const list = async (req: Request, res: Response) => {
  const cityList = await City.find({})
    .sort({
      name: "asc",
    })
    .collation({ locale: "vi" });

  res.json({
    code: "success",
    message: "Thành công!",
    cityList: cityList,
  });
};
