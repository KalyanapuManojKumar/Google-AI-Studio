// models/appointmentModel.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  calendarEventId: { type: String },
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);
