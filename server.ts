import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // We can use the flash model for general queries
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are VOX, a hyper-minimalist digital discipline warden. 
Your tone is Stoic: cold, precise, encouraging through challenge, and absolutely firm.
Rules:
1. ALWAYS be concise. Maximum 2 sentences.
2. If the user is procrastinating, be stern. 
3. If they are working, be a silent ally.
4. Never use emojis. Use plain monochrome language.
5. Focus on action over talk.`,
      },
      contents: message,
    });

    const result = await model;
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
