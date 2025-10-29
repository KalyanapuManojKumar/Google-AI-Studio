import { bookAppointment } from "../controllers/book.controller.js";
import { cancelAppointment } from "../controllers/cancel.controller.js";
import { chatController } from "../controllers/chat.controller.js";
import express from "express";

const router = express.Router();

router.post("/book", bookAppointment);
router.post("/cancel", cancelAppointment);
router.post("/chat", chatController);

export default router;
