import { Router } from "express";
import * as uploadController from "../controllers/upload.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const router = Router();

router.use(authenticate, authorize("seller", "admin"));

router.post("/image", upload.single("image"), uploadController.uploadSingle);
router.post("/images", upload.array("images", 10), uploadController.uploadMultiple);

export default router;
