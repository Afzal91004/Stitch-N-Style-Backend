import express from "express";
import multer from "multer";
import {
  addDesign,
  listDesigns,
  listTrendingDesigns,
} from "../controllers/designController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/trending-designs", listTrendingDesigns);

router.post("/add", upload.array("images", 4), addDesign);
router.get("/list", listDesigns);

export default router;
