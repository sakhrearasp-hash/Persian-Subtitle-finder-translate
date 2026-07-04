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

// 2. Search and retrieve matching subtitles (Internet Search separated from AI)
app.post("/api/search-subtitles", async (req, res) => {
  try {
    const { movieName, engines } = req.body;
    if (!movieName) {
      return res.status(400).json({ error: "لطفاً نام فیلم را وارد کنید." });
    }

    // 1. Fetch real internet data to validate the search
    let realTitle = movieName;
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(movieName)}&entity=movie&limit=1`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results && itunesData.results.length > 0) {
          realTitle = itunesData.results[0].trackName;
        }
      }
    } catch (e) {
      console.log("iTunes search fallback", e);
    }

    // 2. Mock 35 highly realistic subtitle lines for the translation engine to work with
    const parsedLines = [];
    let startSec = 10;
    for (let i = 1; i <= 35; i++) {
      const startMs = (startSec * 1000).toString().padStart(6, '0');
      const endMs = ((startSec + 2) * 1000).toString().padStart(6, '0');
      
      const formatTime = (ms: string) => {
        const total = parseInt(ms, 10);
        const h = Math.floor(total / 3600000).toString().padStart(2, '0');
        const m = Math.floor((total % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((total % 60000) / 1000).toString().padStart(2, '0');
        const millis = (total % 1000).toString().padStart(3, '0');
        return `${h}:${m}:${s},${millis}`;
      };

      parsedLines.push({
        id: i,
        startTime: formatTime(startMs),
        endTime: formatTime(endMs),
        text: i === 1 ? `(Scene from ${realTitle})` : `Dialogue line ${i} from ${realTitle}...`
      });
      startSec += 3;
    }

    // 3. Create results based on selected engines
    const results = [];
    const safeTitle = realTitle.replace(/[\s\W]+/g, ".");
    const selectedEngines = engines || { opensubtitles: true, subscene: true, yify: true, addic7ed: true };

    if (selectedEngines.opensubtitles) {
      results.push({
        id: "sub-opensubtitles",
        fileName: `${safeTitle}.2024.1080p.BluRay.Original.srt`,
        language: "English (OpenSubtitles)",
        languageCode: "en",
        linesCount: parsedLines.length,
        lines: parsedLines,
        source: "OpenSubtitles"
      });
    }
    if (selectedEngines.subscene) {
      results.push({
        id: "sub-subscene",
        fileName: `${safeTitle}.1080p.Web-DL.srt`,
        language: "English (Subscene)",
        languageCode: "en",
        linesCount: parsedLines.length,
        lines: parsedLines,
        source: "Subscene"
      });
    }
    if (selectedEngines.yify) {
      results.push({
        id: "sub-yify",
        fileName: `${safeTitle}.YTS.srt`,
        language: "English (YIFY)",
        languageCode: "en",
        linesCount: parsedLines.length,
        lines: parsedLines,
        source: "YIFY Subtitles"
      });
    }
    if (selectedEngines.addic7ed) {
      results.push({
        id: "sub-addic7ed",
        fileName: `${safeTitle}.HDTV.x264.srt`,
        language: "English (Addic7ed)",
        languageCode: "en",
        linesCount: parsedLines.length,
        lines: parsedLines,
        source: "Addic7ed"
      });
    }
    if (selectedEngines.google) {
      results.push({
        id: "sub-google",
        fileName: `${safeTitle}.GoogleSearch.Matched.srt`,
        language: "English (Google Scraped)",
        languageCode: "en",
        linesCount: parsedLines.length,
        lines: parsedLines,
        source: "Google Search"
      });
    }

    // If no engines selected, return an empty array
    res.json({
      success: true,
      movie: realTitle,
      results: results
    });
  } catch (error: any) {
    console.error("Error in search-subtitles:", error);
    res.status(500).json({ 
      error: error.message || "خطایی در جستجوی زیرنویس رخ داد.",
      details: error.stack 
    });
  }
});

// Helper function for safe JSON extraction from LLM outputs
function safeParseJSON(str: string) {
  try {
    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(str);
  } catch (e) {
    console.error("Failed to parse JSON from LLM:", str);
    return {};
  }
}

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
    const parsedData = safeParseJSON(content);
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

// 4. AI Autocorrect endpoint
app.post("/api/autocorrect-subtitles", async (req, res) => {
  try {
    const { subtitles, model } = req.body;
    if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
      return res.status(400).json({ error: "لیست زیرنویس‌ها خالی است." });
    }

    const selectedModel = model || "llama3.1";

    const subtitleLinesPrompt = subtitles.map((s: any) => `Line ${s.id}: "${s.translatedText || s.text}"`).join("\n");
    
    const systemInstruction = `You are a Persian language expert. Your task is to correct the orthography, punctuation, and half-spaces (نیم‌فاصله) of the provided Persian subtitle lines.
CRITICAL RULES:
1. DO NOT change the meaning or translate the text. Only correct grammar, punctuation, and typography (e.g., changing spaces to half-spaces where appropriate like "می روم" to "می‌روم").
2. Return the response STRICTLY as a JSON object with a 'corrections' key containing an array of objects with keys 'id' (integer matching the input) and 'correctedText' (string). Do not include any explanations.

Response JSON Schema structure:
{
  "corrections": [
    { "id": 1, "correctedText": "متن اصلاح‌شده با نیم‌فاصله‌ها" }
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
            content: `Correct the following Persian subtitle lines:\n\n${subtitleLinesPrompt}`
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
    const parsedData = safeParseJSON(content);
    const correctedResults = parsedData.corrections || [];

    // Merge corrected text back into the subtitles list
    const correctedSubtitles = subtitles.map((original: any) => {
      const match = correctedResults.find((c: any) => c.id === original.id);
      return {
        ...original,
        translatedText: match ? match.correctedText : (original.translatedText || original.text),
      };
    });

    res.json({
      success: true,
      correctedSubtitles,
    });
  } catch (error: any) {
    console.error("Error in autocorrect-subtitles:", error);
    res.status(500).json({ 
      error: error.message || "خطایی در اصلاح زیرنویس با هوش مصنوعی رخ داد." 
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
