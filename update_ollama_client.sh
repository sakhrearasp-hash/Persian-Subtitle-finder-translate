#!/bin/bash
sed -i '456,482c\
  const validateOllamaConnection = async () => {\
    setIsValidatingKey(true);\
    setError(null);\
    setSuccess(null);\
    try {\
      const res = await fetch("http://localhost:11434/api/tags");\
      if (!res.ok) throw new Error("Ollama is not responding.");\
      const data = await res.json();\
      if (data.models) {\
        setAvailableModels(data.models);\
        if (data.models.length > 0 && !data.models.find((m: any) => m.name === selectedModel)) {\
          setSelectedModel(data.models[0].name);\
        }\
      }\
      setSuccess("ارتباط با Ollama با موفقیت برقرار شد. مدل‌ها دریافت شدند.");\
      setIsApiConfigOpen(false);\
    } catch (err: any) {\
      setError("خطا در اتصال به Ollama. مطمئن شوید برنامه در حال اجراست و متغیر OLLAMA_ORIGINS=\\"*\\" تنظیم شده است.");\
    } finally {\
      setIsValidatingKey(false);\
    }\
  };' src/App.tsx
