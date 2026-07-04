#!/bin/bash
sed -i '263,313c\
  const handleTranslateWithAI = async () => {\
    if (subtitles.length === 0) {\
      setError("هیچ زیرنویسی برای ترجمه بارگذاری نشده است.");\
      return;\
    }\
\
    setIsTranslating(true);\
    setTranslationProgress(0);\
    setError(null);\
    setSuccess(null);\
\
    const batchSize = 35;\
    const totalLines = subtitles.length;\
    let updatedSubtitles = [...subtitles];\
\
    try {\
      for (let i = 0; i < totalLines; i += batchSize) {\
        const chunk = subtitles.slice(i, i + batchSize);\
        \
        const subtitleLinesPrompt = chunk.map((s: any) => `Line ${s.id}: "${s.text}"`).join("\\n");\
        const systemInstruction = `You are a professional cinematic subtitle translator and localization engine.\\nYou will translate movie subtitles into natural Iranian Persian (Farsi - فارسی روان ایرانی).\\n\\nCRITICAL RULES:\\n1. DO NOT translate line-by-line in isolation.\\n2. ALWAYS group every 2 to 3 consecutive subtitle lines together as one unified semantic unit/chunk, translate them together to capture the full context, and then split the resulting translation back into the individual original line IDs.\\n3. Preserve subtitle TIMING and sync EXACTLY (do not merge, delete, or re-order lines).\\n4. Translate in CONTEXT-AWARE mode (not literal translation). Understand dialogue as part of a scene, preserving emotional tone, sarcasm, humor, and tension.\\n5. Maintain character voice consistency and keep names, places, and proper nouns consistent.\\n6. The output must be natural Iranian spoken Persian (not formal/book language) of movie-quality localization (like professional Netflix dubbing subtitles).\\n7. Return the response STRICTLY as a JSON object with a \\'translations\\' key containing an array of objects with keys \\'id\\' (integer matching the input) and \\'translatedText\\' (string). Do not include any explanations or markdown outside the JSON structure.\\n\\nResponse JSON Schema structure:\\n{\\n  "translations": [\\n    { "id": 1, "translatedText": "متن ترجمه شده به فارسی روان" }\\n  ]\\n}`;\
\
        const response = await fetch("http://localhost:11434/api/chat", {\
          method: "POST",\
          headers: { "Content-Type": "application/json" },\
          body: JSON.stringify({\
            model: selectedModel,\
            messages: [\
              { role: "system", content: systemInstruction },\
              { role: "user", content: `Translate the following consecutive subtitle lines using the 2-3 line semantic chunking strategy:\\n\\n${subtitleLinesPrompt}` }\
            ],\
            stream: false,\
            format: "json"\
          }),\
        });\
\
        if (!response.ok) {\
          throw new Error("خطا در ترجمه دسته اول زیرنویس‌ها با Ollama.");\
        }\
\
        const data = await response.json();\
        const content = data.message?.content || "{}";\
        let parsedData: any = {};\
        try {\
          const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);\
          parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);\
        } catch (e) { console.error("Parse Error"); }\
\
        const translatedResults = parsedData.translations || [];\
        if (translatedResults.length > 0) {\
          translatedResults.forEach((translatedItem: any) => {\
            const index = updatedSubtitles.findIndex(item => item.id === translatedItem.id);\
            if (index !== -1) {\
              updatedSubtitles[index] = { ...updatedSubtitles[index], translatedText: translatedItem.translatedText };\
            }\
          });\
        }\
\
        setSubtitles([...updatedSubtitles]);\
        setTranslationProgress(Math.min(100, Math.round(((i + batchSize) / totalLines) * 100)));\
      }\
      setSuccess("فرآیند ترجمه هوشمند در تمام خطوط با موفقیت به پایان رسید.");\
    } catch (err: any) {\
      setError(err.message || "خطا در ترجمه.");\
    } finally {\
      setIsTranslating(false);\
      setTranslationProgress(100);\
    }\
  };' src/App.tsx
