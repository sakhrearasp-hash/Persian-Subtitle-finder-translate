#!/bin/bash
sed -i '/\/\/ Validate Ollama connection with the Express server/!b;n;c\
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
        if (data.models && data.models.models) {\
           setAvailableModels(data.models.models);\
           if (data.models.models.length > 0 && !data.models.models.find((m: any) => m.name === selectedModel)) {\
             setSelectedModel(data.models.models[0].name);\
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
  };' src/App.tsx
