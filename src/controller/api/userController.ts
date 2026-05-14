import { CustomRequest } from "@/types/custom-type";
import { Response } from "express";

export const changeLanguage = async (req: CustomRequest, res: Response) => {
  const { lng } = req.query;

  res
    .status(200)
    .cookie("i18next", lng)
    .json({ message: req.t("changeLang", { lang: lng }) });
};
