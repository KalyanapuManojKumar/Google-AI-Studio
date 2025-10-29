// controllers/appointmentController.js
import { Appointment } from "../models/book-appointement.model.js";
import { sendConfirmationEmail } from "../services/email-service.js";
import { createCalendarEvent } from "../services/calender-service.js";

export const bookAppointment = async (req, res) => {
  try {
    const { name, email, phone, service, date, time } = req.body;

    if (!name || !email || !phone || !service || !date || !time) {
      return res
        .status(200)
        .json({ success: false, message: "All fields are required." });
    }

    // Check if slot exists
    const existing = await Appointment.findOne({ date, time });
    if (existing) {
      return res
        .status(200)
        .json({ success: false, message: "Slot not available." });
    }

    // Create Google Calendar event
    const calendarEvent = await createCalendarEvent({
      name,
      phone,
      service,
      date,
      time,
    });

    // Save to DB
    const newAppt = new Appointment({
      name,
      email,
      phone,
      service,
      date,
      time,
      calendarEventId: calendarEvent.id,
    });
    await newAppt.save();

    // Send email confirmation
    await sendConfirmationEmail(email, name, service, date, time);

    res
      .status(201)
      .json({ success: true, message: "Appointment booked successfully!" });
  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
