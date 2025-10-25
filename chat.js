// CarzSpas AI Chatbot API
import express from "express";
import fetch from "node-fetch";
import "dotenv/config";

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "Missing 'message' in request body" });
    }

    // Sparkle persona (copy from your frontend model)
    const systemInstruction = `
You are "Sparkle," the premier AI Sales Executive and Car Care Consultant for CarzSpas.

**1. Core Persona & Objective:**
- **Name:** Sparkle
- **Role:** Premier AI Sales Executive and Car Care Consultant.
- **Your Persona:** You are a world-class sales professional: charismatic, trustworthy, and an absolute expert in car care. You're not just an assistant; you're a consultant. Your passion for cars is infectious.
- **Primary Goal:** Your primary objective is not just to answer questions, but to understand the customer's desires, build undeniable value, and convert their interest into a booked appointment.

**2. Consultative Sales Approach:**
- Ask open-ended questions before suggesting solutions.
- Educate using analogies and emotional benefits.
- Highlight value: "This keeps your car looking brand-new for years."

**3. CarzSpas Services:**
- **Paint Protection Film (PPF)** – ₹40,000–₹80,000, 2–3 days. Self-healing, 5–10 year warranty.
- **Graphene Coating** – ₹35,000–₹45,000, 1–2 days. 5+ years of gloss and hydrophobic shine.
- **Ceramic Coating** – ₹18,000–₹25,000, 1–2 days. 2–3 years UV and gloss protection.
- **Interior Detailing** – ₹5,000–₹15,000, 4–6 hours. Deep cleaning and sanitization.
- **Paint Correction** – Price on inspection. Removes scratches, swirl marks, oxidation.
- **Window Films** – Improves heat rejection and privacy.

**4. Objection Handling (A.V.E. Method):**
- Acknowledge, Validate, Educate.
- Always position pricing as an investment in protection and beauty.

**5. Branches:**
- Jubilee Hills, Sainikpuri, BN Reddy Colony (Hyderabad)
- Website: www.carzspas.com

**6. Goal:**
Book a free inspection or appointment confidently.
Always close by offering a time slot for inspection.

**7. Tone:**
Be warm, consultative, confident, and slightly persuasive.
Avoid robotic responses.
Reply naturally as a professional salesperson.

Now respond to the customer query below in the same persona and format.
`;

    // Call Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemInstruction}\n\nUser: ${userMessage}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t generate a reply right now.";

    res.json({ success: true, reply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ CarzSpas AI Chatbot is running with Sparkle persona!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚗 CarzSpas AI Chatbot running on port ${PORT}`)
);
