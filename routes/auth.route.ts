import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/refresh", authController.refreshToken);

router.get("/check", authMiddleware.verifyToken, authController.check);

export default router;
