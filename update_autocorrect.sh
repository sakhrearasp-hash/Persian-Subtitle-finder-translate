#!/bin/bash
sed -i '344,394c\
  const handleAutocorrectWithAI = async () => {\
    if (subtitles.length === 0) {\
      setError("هیچ زیرنویسی برای اصلاح بارگذاری نشده است.");\
      return;\
    }\
\
    setIsAutocorrecting(true);\
    setAutocorrectProgress(0);\
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
        const subtitleLinesPrompt = chunk.map((s: any) => `Line ${s.id}: "${s.translatedText || s.text}"`).join("\\n");\
        const systemInstruction = `You are a Persian language expert. Your task is to correct the orthography, punctuation, and half-spaces (نیم‌فاصله) of the provided Persian subtitle lines.\\nCRITICAL RULES:\\n1. DO NOT change the meaning or translate the text. Only correct grammar, punctuation, and typography (e.g., changing spaces to half-spaces where appropriate like "می روم" to "می‌روم").\\n2. Return the response STRICTLY as a JSON object with a \\'corrections\\' key containing an array of objects with keys \\'id\\' (integer matching the input) and \\'correctedText\\' (string). Do not include any explanations.\\n\\nResponse JSON Schema structure:\\n{\\n  "corrections": [\\n    { "id": 1, "correctedText": "متن اصلاح‌شده با نیم‌فاصله‌ها" }\\n  ]\\n}`;\
\
        const response = await fetch("http://localhost:11434/api/chat", {\
          method: "POST",\
          headers: { "Content-Type": "application/json" },\
          body: JSON.stringify({\
            model: selectedModel,\
            messages: [\
              { role: "system", content: systemInstruction },\
              { role: "user", content: `Correct the following Persian subtitle lines:\\n\\n${subtitleLinesPrompt}` }\
            ],\
            stream: false,\
            format: "json"\
          }),\
        });\
\
        if (!response.ok) {\
          throw new Error("خطا در اصلاح دسته اول زیرنویس‌ها با Ollama.");\
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
        const correctedResults = parsedData.corrections || [];\
        if (correctedResults.length > 0) {\
          correctedResults.forEach((correctedItem: any) => {\
            const index = updatedSubtitles.findIndex(item => item.id === correctedItem.id);\
            if (index !== -1) {\
              updatedSubtitles[index] = { ...updatedSubtitles[index], text: updatedSubtitles[index].text, translatedText: correctedItem.correctedText };\
            }\
          });\
        }\
\
        setSubtitles([...updatedSubtitles]);\
        setAutocorrectProgress(Math.min(100, Math.round(((i + batchSize) / totalLines) * 100)));\
      }\
      setSuccess("فرآیند اصلاح خودکار نگارشی با موفقیت به پایان رسید.");\
    } catch (err: any) {\
      setError(err.message || "خطا در اصلاح نیم‌فاصله‌ها.");\
    } finally {\
      setIsAutocorrecting(false);\
      setAutocorrectProgress(100);\
    }\
  };' src/App.tsx
