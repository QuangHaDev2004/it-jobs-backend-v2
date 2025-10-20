import { Router } from "express";
import * as companyController from "../controllers/company.controller";
import * as companyValidate from "../validates/company.validate";

const router = Router();

router.post(
  "/register",
  companyValidate.registerPost,
  companyController.registerPost
);

// router.post("/login", userValidate.loginPost, userController.loginPost);

export default router;
