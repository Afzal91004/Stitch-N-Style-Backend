import express from "express";
import multer from "multer";
import {
  designerLogin,
  designerRegistration,
} from "../controllers/userController.js";
import {
  addDesigner,
  listDesigners,
  listTopDesigners,
} from "../controllers/designerController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const designerRouter = express.Router();

designerRouter.post("/login", designerLogin);
designerRouter.post("/register", designerRegistration);
designerRouter.get("/top-designers", listTopDesigners);
router.post("/add", upload.single("image"), addDesigner);
router.get("/list", listDesigners);

export default designerRouter;
