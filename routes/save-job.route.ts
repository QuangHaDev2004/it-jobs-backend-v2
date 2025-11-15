import { Router } from "express";
import * as saveJobController from "../controllers/save-job.controller";
import * as authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/:id", authMiddleware.verifyTokenUser, saveJobController.saveJob);

router.get("/", authMiddleware.verifyTokenUser, saveJobController.list);

router.delete("/:id", authMiddleware.verifyTokenUser, saveJobController.unSaveJob);

export default router;
