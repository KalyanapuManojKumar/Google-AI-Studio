// services/geminiService.js
import fetch from "node-fetch";

export const generateGeminiResponse = async (
  systemInstruction,
  userMessage,
  maxWords
) => {
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

  const truncatedReply =
    rawReply.split(" ").slice(0, maxWords).join(" ") +
    (rawReply.split(" ").length > maxWords ? "..." : "");

  return truncatedReply;
};
