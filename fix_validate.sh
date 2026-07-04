#!/bin/bash
sed -i '450,502c\
  // Validate Ollama connection with the Express server\
  const validateOllamaConnection = async () => {\
    setIsValidatingKey(true);\
    setError(null);\
    setSuccess(null);\
    try {\
      const res = await fetch("/api/validate-key", {\
        method: "POST",\
        headers: { "Content-Type": "application/json" },\
      });\
      const data = await res.json();\
      if (res.ok && data.success) {\
        if (data.models) {\
           setAvailableModels(data.models);\
           if (data.models.length > 0 && !data.models.find((m: any) => m.name === selectedModel)) {\
             setSelectedModel(data.models[0].name);\
           }\
        }\
        setSuccess("سنجش موفقیت‌آمیز بود! ارتباط با Ollama با موفقیت برقرار شد.");\
        setIsApiConfigOpen(false);\
      } else {\
        setError(data.error || "موتور Ollama در دسترس نیست.");\
      }\
    } catch (err: any) {\
      setError("خطا در برقراری ارتباط با سرور برای سنجش موتور Ollama.");\
    } finally {\
      setIsValidatingKey(false);\
    }\
  };\
\
  // Clear/End Subtitle Search\
  const handleClearSearch = () => {\
    setMovieName("");\
    setSearchResults([]);\
    setSelectedResultId(null);\
    setError(null);\
  };' src/App.tsx
