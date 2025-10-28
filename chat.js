// CarzSpas AI Chatbot API
import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
app.use(express.json());

// =======================
// Chat Endpoint
// =======================

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const mode = req.body.mode || "auto"; // 'short', 'detailed', or 'auto'

    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "Missing 'message' in request body" });
    }

    // 🔹 Decide response mode automatically
    let responseMode = mode;
    if (mode === "auto") {
      const shortTriggers = ["hi", "hello", "thanks", "ok", "bye", "thank you"];
      responseMode = shortTriggers.some((w) =>
        userMessage.toLowerCase().includes(w)
      )
        ? "short"
        : "detailed";
    }

    // Set max word limit
    const maxWords = responseMode === "short" ? 80 : 150;

    const systemInstruction = `
You are "Sparkle" — the AI Sales Executive and Car Care Consultant for **CarzSpas**, India’s premium car detailing and protection studio.

---

### 🎯 Your Role & Personality
- Be warm, professional, and persuasive.
- Speak like a real customer consultant who knows the business well.
- Understand intent (book, cancel, query, or general chat).
- Always guide users toward the right action — booking or getting help.

---

### 🏪 CarzSpas Services & Pricing
Provide clear, trustworthy pricing ranges when asked:
- **PPF (Paint Protection Film):** ₹40,000 – ₹80,000
- **Graphene Coating:** ₹35,000 – ₹45,000
- **Ceramic Coating:** ₹18,000 – ₹25,000
- **Interior Detailing:** ₹5,000 – ₹15,000
- **Paint Correction / Window Films:** Price on inspection

Never invent prices or discounts.

---

### 📍 Branch Locations
Operate only at these branches (never invent new ones):
- Jubilee Hills, Hyderabad
- Alwal, Hyderabad
- BN Reddy Colony, Hyderabad

**Maps:**
- https://maps.app.goo.gl/AWsSvUZLAPQd19c3A
- https://maps.app.goo.gl/fi7cuMmsYKcgEkAz6

---

### 🌐 Contact & Web Info
- Website (Google Business Listings):
  - https://www.google.com/search?q=CarzSpas+Suchitra
  - https://www.google.com/search?q=Carzspas
- Never fabricate or shorten links.

---

### 💬 Response Style
- Mode: ${responseMode.toUpperCase()}
  - **short** → under 80 words.
  - **detailed** → 100–150 words.
- Write naturally like a human agent — avoid robotic or generic replies.
- Use emojis sparingly (only friendly ones like 😊 or 🚗).
- End with a clear action (e.g., “Would you like me to book a slot?”).

---

### 🤖 Behavior Rules
1. If user message includes **“book”**, encourage or assist with booking.  
   - If details are missing, ask for all fields in this format:
     \`\`\`json
     {
       "name": "Your Name",
       "email": "your@email.com",
       "phone": "+91XXXXXXXXXX",
       "service": "Ceramic Coating",
       "date": "YYYY-MM-DD",
       "time": "HH:mm:ss"
     }
     \`\`\`
2. If user message includes **“cancel”**, ask for:
     \`\`\`json
     {
       "email": "your@email.com",
       "date": "YYYY-MM-DD",
       "time": "HH:mm:ss"
     }
     \`\`\`
3. If unsure, politely clarify instead of guessing.
4. Never generate unrelated information or links.
5. Keep replies concise, positive, and business-oriented.

---

### 🎨 Tone Examples
- “Got it! I can help book your Ceramic Coating appointment. Could you please share your name, email, and preferred time?”
- “Your PPF service pricing starts around ₹40,000. Would you like me to check available slots?”
- “To cancel your booking, I just need your registered email, date, and time.”

---

**Always reply within ${maxWords} words, in a helpful and brand-consistent tone.**
`;

    // 🔸 Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemInstruction}\n\nUser: ${userMessage}\n\nRespond within ${maxWords} words.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const rawReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Sorry, I couldn’t generate a reply right now.";

    // 🔸 Final safeguard: truncate to limit
    const reply =
      rawReply.split(" ").slice(0, maxWords).join(" ") +
      (rawReply.split(" ").length > maxWords ? "..." : "");

    res.json({
      success: true,
      mode: responseMode,
      reply,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const appointmentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  service: String,
  date: String,
  time: String,
  calendarEventId: String,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

// =======================
// Google Calendar Setup
// =======================
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// =======================
// Email Setup
// =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASS },
});

// =======================
// Appointment Booking API
// =======================
app.post("/api/book", async (req, res) => {
  try {
    const { name, email, phone, service, date, time } = req.body;

    // 1. Check slot availability
    const existing = await Appointment.findOne({ date, time });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Slot not available" });
    }

    // 2. Prepare Calendar Event times in IST
    const startDateTime = dayjs.tz(`${date}T${time}`, "Asia/Kolkata");
    const endDateTime = startDateTime.add(1, "hour"); // default 1-hour slot

    const event = {
      summary: `${service} Appointment - ${name}`,
      description: `Customer: ${name}\nService: ${service}\nPhone: ${phone}`,
      start: {
        dateTime: startDateTime.format(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime.format(),
        timeZone: "Asia/Kolkata",
      },
    };

    // 3. Create Google Calendar Event
    const calendarResponse = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    // 4. Save appointment in MongoDB
    const newAppt = new Appointment({
      name,
      email,
      phone,
      service,
      date,
      time,
      calendarEventId: calendarResponse.data.id,
    });
    await newAppt.save();

    // 5. Send confirmation email
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Appointment Confirmation - CarzSpas",
      text: `Dear ${name}, your ${service} appointment is confirmed for ${date} at ${time}.`,
    });

    res.json({ success: true, message: "Appointment booked successfully!" });
  } catch (err) {
    console.error("❌ Booking Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =======================
// Appointment Cancel API
// =======================
app.post("/api/cancel", async (req, res) => {
  try {
    const { email, date, time } = req.body;
    const appt = await Appointment.findOne({ email, date, time });
    if (!appt)
      return res.status(404).json({ success: false, message: "Not found" });

    // Delete from Google Calendar
    await calendar.events.delete({
      calendarId: "primary",
      eventId: appt.calendarEventId,
    });

    // Delete from MongoDB
    await Appointment.deleteOne({ _id: appt._id });

    // Send email confirmation
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Appointment Cancelled - CarzSpas",
      text: `Your appointment for ${appt.service} on ${appt.date} at ${appt.time} has been cancelled.`,
    });

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ CarzSpas AI Chatbot is running with Sparkle persona!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚗 CarzSpas AI Chatbot running on port ${PORT}`)
);
