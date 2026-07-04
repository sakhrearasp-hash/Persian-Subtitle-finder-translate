#!/bin/bash
cat << 'INNER_EOF' > server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High limits for processing large subtitle files
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // 1. Healthcheck Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2. Search and retrieve matching subtitles from OpenSubtitles
  app.post("/api/search-subtitles", async (req, res) => {
    try {
      const { movieName, apiKey } = req.body;
      if (!movieName) {
        return res.status(400).json({ error: "لطفاً نام فیلم را وارد کنید." });
      }
      if (!apiKey) {
         return res.status(401).json({ error: "کلید API OpenSubtitles وارد نشده است. لطفاً از تنظیمات کلید خود را وارد کنید." });
      }

      // 1. Fetch search results from OpenSubtitles API
      const searchRes = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}&languages=en`, {
        headers: {
          "Api-Key": apiKey,
          "User-Agent": "PersianSubtitleFinder v1.0"
        }
      });
      
      if (!searchRes.ok) {
        const errorText = await searchRes.text();
        console.error("OpenSubtitles API error:", errorText);
        return res.status(searchRes.status).json({ error: "خطا در ارتباط با OpenSubtitles. کلید API خود را بررسی کنید." });
      }

      const searchData = await searchRes.json();
      if (!searchData.data || searchData.data.length === 0) {
        return res.status(404).json({ error: "هیچ زیرنویسی برای این فیلم یافت نشد." });
      }

      // Map to our internal results format
      const results = searchData.data.slice(0, 10).map((item: any) => {
        const file = item.attributes.files[0];
        return {
          id: file.file_id, // we use file_id as the ID for downloading later
          fileName: file.file_name,
          language: item.attributes.language,
          languageCode: "en",
          source: "OpenSubtitles",
          fps: item.attributes.fps || "نامشخص",
          downloadCount: item.attributes.download_count,
          release: item.attributes.release || "نامشخص",
          fileId: file.file_id
        };
      });

      return res.json({ success: true, results });
    } catch (error: any) {
      console.error("Error in search-subtitles:", error);
      return res.status(500).json({ error: "خطای سرور در هنگام جستجوی زیرنویس." });
    }
  });

  // 2b. Download actual subtitle file content from OpenSubtitles
  app.post("/api/download-subtitle", async (req, res) => {
    try {
      const { fileId, apiKey } = req.body;
      if (!fileId || !apiKey) {
        return res.status(400).json({ error: "اطلاعات دانلود ناقص است." });
      }

      const downloadRes = await fetch("https://api.opensubtitles.com/api/v1/download", {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "PersianSubtitleFinder v1.0"
        },
        body: JSON.stringify({ file_id: parseInt(fileId) })
      });

      if (!downloadRes.ok) {
        const errorText = await downloadRes.text();
        console.error("OpenSubtitles Download error:", errorText);
        return res.status(downloadRes.status).json({ error: "خطا در دریافت لینک دانلود از OpenSubtitles." });
      }

      const downloadData = await downloadRes.json();
      if (!downloadData.link) {
         return res.status(400).json({ error: "لینک دانلود یافت نشد." });
      }

      // Fetch the actual file content from the provided link
      const fileRes = await fetch(downloadData.link);
      if (!fileRes.ok) {
        return res.status(500).json({ error: "خطا در دانلود محتوای فایل زیرنویس." });
      }
      const fileText = await fileRes.text();

      return res.json({ success: true, fileContent: fileText });
    } catch (error: any) {
      console.error("Error in download-subtitle:", error);
      return res.status(500).json({ error: "خطای سرور در هنگام دانلود فایل." });
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
        const errorData = await response.json();
        return res.status(response.status).json({ error: errorData.error || "خطا در ارتباط با Ollama" });
      }

      const data = await response.json();
      return res.json({ success: true, message: data.message });
    } catch (error: any) {
      console.error("Error in translation API:", error);
      return res.status(500).json({ error: "سرور ترجمه در دسترس نیست. آیا Ollama در حال اجراست؟" });
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
        const errorData = await response.json();
        return res.status(response.status).json({ error: errorData.error || "خطا در ارتباط با Ollama" });
      }

      const data = await response.json();
      return res.json({ success: true, message: data.message });
    } catch (error: any) {
      console.error("Error in autocorrect API:", error);
      return res.status(500).json({ error: "سرور تصحیح در دسترس نیست. آیا Ollama در حال اجراست؟" });
    }
  });

  // Vite middleware for development
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
INNER_EOF
