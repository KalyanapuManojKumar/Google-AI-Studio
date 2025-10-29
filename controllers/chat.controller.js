import { generateGeminiResponse } from "../services/gemini-service.js";
import { getSparkleInstructions } from "../config/system-instructions.js";

export const chatController = async (req, res) => {
  try {
    const userMessage = req.body.message;
    const mode = req.body.mode || "auto";

    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "Missing 'message' in request body" });
    }

    // Decide response mode
    let responseMode = mode;
    if (mode === "auto") {
      const shortTriggers = ["hi", "hello", "thanks", "ok", "bye", "thank you"];
      responseMode = shortTriggers.some((w) =>
        userMessage.toLowerCase().includes(w)
      )
        ? "short"
        : "detailed";
    }

    const maxWords = responseMode === "short" ? 80 : 150;
    const systemInstruction = getSparkleInstructions(responseMode, maxWords);

    const reply = await generateGeminiResponse(
      systemInstruction,
      userMessage,
      maxWords
    );

    res.json({ success: true, mode: responseMode, message: reply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
