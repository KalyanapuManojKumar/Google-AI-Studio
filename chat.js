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
                  text: `You are Sparkle, the CarzSpas AI assistant. You help customers learn about car services such as PPF, Ceramic Coating, Interior Detailing, and Paint Correction. 
Keep your tone friendly, clear, and professional. Respond to the user query below:\n\n${userMessage}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Parse Gemini response
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t generate a reply right now.";

    res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ CarzSpas AI Chatbot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
