import { Appointment } from "../models/book-appointement.model.js";
import { deleteCalendarEvent } from "../services/calender-service.js";
import { sendCancellationEmail } from "../services/email-service.js";

export const cancelAppointment = async (req, res) => {
  try {
    const { email, date, time } = req.body;

    if (!email || !date || !time) {
      return res.status(200).json({
        success: false,
        message: "Email, date, and time are required.",
      });
    }

    const appt = await Appointment.findOne({ email, date, time });
    if (!appt) {
      return res
        .status(200)
        .json({ success: false, message: "Appointment not found." });
    }

    // Delete from Google Calendar
    await deleteCalendarEvent(appt.calendarEventId);

    // Delete from MongoDB
    await Appointment.deleteOne({ _id: appt._id });

    // Send cancellation email
    await sendCancellationEmail(
      email,
      appt.name,
      appt.service,
      appt.date,
      appt.time
    );

    res.json({ success: true, message: "Appointment cancelled successfully!" });
  } catch (error) {
    console.error("❌ Cancel Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
