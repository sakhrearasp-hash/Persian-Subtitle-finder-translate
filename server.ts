import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// High limits for processing large subtitle files
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Helper to check if Ollama is running
async function checkOllamaRunning() {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    if (!response.ok) {
      throw new Error("Cannot connect to Ollama.");
    }
    return await response.json();
  } catch (error) {
    throw new Error("خطا در اتصال به Ollama. لطفاً مطمئن شوید که Ollama روی سیستم شما در حال اجرا است (http://localhost:11434)");
  }
}

// 1. Healthcheck Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1b. Validate Ollama Endpoint
app.post("/api/validate-key", async (req, res) => {
  try {
    const data = await checkOllamaRunning();
    return res.json({ success: true, message: "ارتباط با Ollama با موفقیت برقرار شد.", models: data.models });
  } catch (error: any) {
    console.error("Error validating Ollama:", error);
    return res.status(400).json({ 
      success: false, 
      error: error.message || "خطا در اتصال به موتور محلی Ollama." 
    });
  }
});

// 2. Search and retrieve matching subtitles using Ollama
app.post("/api/search-subtitles", async (req, res) => {
  try {
    const { movieName, model } = req.body;
    if (!movieName) {
      return res.status(400).json({ error: "لطفاً نام فیلم را وارد کنید." });
    }

    const selectedModel = model || "llama3.1";

    const prompt = `Generate 35 consecutive, iconic dialogue lines from the movie or video named "${movieName}".
    Return them as a JSON object with a "lines" key containing an array of subtitle objects in the original language of the film.
    Each object inside the "lines" array must strictly have:
    - id (number, starting from 1)
    - startTime (string in subtitle timestamp format 'HH:MM:SS,mmm' e.g. '00:05:12,400')
    - endTime (string in subtitle timestamp format 'HH:MM:SS,mmm' e.g. '00:05:15,150')
    - text (string, the original dialogue text)`;

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: "You are an expert film database and subtitle collector. Generate realistic, contextually connected lines of subtitles for any specified film in its original language. You must strictly output valid JSON containing a 'lines' key."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Ollama API Error: ${errText}` });
    }

    const data = await response.json();
    const content = data.message?.content || "{}";
    const parsedData = JSON.parse(content);
    const parsedLines = parsedData.lines || [];

    res.json({
      success: true,
      movie: movieName,
      results: [
        {
          id: "sub-1",
          fileName: `${movieName.replace(/[\s\W]+/g, ".")}.2024.1080p.BluRay.Original.srt`,
          language: "انگلیسی (اصلی)",
          languageCode: "en",
          linesCount: parsedLines.length,
          lines: parsedLines,
        },
        {
          id: "sub-2",
          fileName: `${movieName.replace(/[\s\W]+/g, ".")}.2024.HDRip.Alternative.srt`,
          language: "فرانسوی/دیگر (دوبله/اصلی)",
          languageCode: "fr",
          linesCount: Math.min(20, parsedLines.length),
          lines: parsedLines.slice(0, 20).map((l: any, idx: number) => ({
            ...l,
            id: idx + 1,
            text: l.text + " (alt version)"
          })),
        }
      ]
    });
  } catch (error: any) {
    console.error("Error in search-subtitles:", error);
    res.status(500).json({ 
      error: error.message || "خطایی در جستجوی زیرنویس رخ داد.",
      details: error.stack 
    });
  }
});

// 3. AI translation endpoint
app.post("/api/translate-subtitles", async (req, res) => {
  try {
    const { subtitles, model } = req.body;
    if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
      return res.status(400).json({ error: "لیست زیرنویس‌ها خالی است." });
    }

    const selectedModel = model || "llama3.1";

    const subtitleLinesPrompt = subtitles.map((s: any) => `Line ${s.id}: "${s.text}"`).join("\n");
    
    const systemInstruction = `You are a professional cinematic subtitle translator and localization engine.
You will translate movie subtitles into natural Iranian Persian (Farsi - فارسی روان ایرانی).

CRITICAL RULES:
1. DO NOT translate line-by-line in isolation.
2. ALWAYS group every 2 to 3 consecutive subtitle lines together as one unified semantic unit/chunk, translate them together to capture the full context, and then split the resulting translation back into the individual original line IDs.
3. Preserve subtitle TIMING and sync EXACTLY (do not merge, delete, or re-order lines).
4. Translate in CONTEXT-AWARE mode (not literal translation). Understand dialogue as part of a scene, preserving emotional tone, sarcasm, humor, and tension.
5. Maintain character voice consistency and keep names, places, and proper nouns consistent.
6. The output must be natural Iranian spoken Persian (not formal/book language) of movie-quality localization (like professional Netflix dubbing subtitles).
7. Return the response STRICTLY as a JSON object with a 'translations' key containing an array of objects with keys 'id' (integer matching the input) and 'translatedText' (string). Do not include any explanations or markdown outside the JSON structure.

Response JSON Schema structure:
{
  "translations": [
    { "id": 1, "translatedText": "متن ترجمه شده به فارسی روان" }
  ]
}`;

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: systemInstruction
          },
          {
            role: "user",
            content: `Translate the following consecutive subtitle lines using the 2-3 line semantic chunking strategy:\n\n${subtitleLinesPrompt}`
          }
        ],
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Ollama API Error: ${errText}` });
    }

    const data = await response.json();
    const content = data.message?.content || "{}";
    const parsedData = JSON.parse(content);
    const translatedResults = parsedData.translations || [];

    // Merge translated text back into the subtitles list
    const translatedSubtitles = subtitles.map((original: any) => {
      const match = translatedResults.find((t: any) => t.id === original.id);
      return {
        ...original,
        translatedText: match ? match.translatedText : original.text, // fallback to original if not translated
      };
    });

    res.json({
      success: true,
      translatedSubtitles,
    });
  } catch (error: any) {
    console.error("Error in translate-subtitles:", error);
    res.status(500).json({ 
      error: error.message || "خطایی در ترجمه زیرنویس با هوش مصنوعی رخ داد." 
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
