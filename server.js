import express from "express";
import "dotenv/config";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import connectDB from "./database/database.js";
import cors from "cors";
import router from "./routes/routes.routes.js";
connectDB();

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
app.use(express.json());

const corsOptions = {
  origin: ["*"], // replace with actual frontend origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/api", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
