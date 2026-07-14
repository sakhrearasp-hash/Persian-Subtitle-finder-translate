import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  Languages, 
  Film, 
  AlertCircle, 
  FileText, 
  FileJson,
  Trash2, 
  Plus, 
  Sliders, 
  CheckCircle2, 
  Info,
  HelpCircle,
  FileCode,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { SubtitleLine, SubtitleSearchResult, TranslationProvider } from "./types";
import { parseSRT, stringifySRT } from "./utils/srtParser";
import { motion, AnimatePresence } from "motion/react";
import persepolisBg from "./assets/images/persepolis_turquoise_1783153119816.jpg";

// Pre-loaded elegant example subtitles of Interstellar to showcase the premium UI
const DEFAULT_SUBTITLES: SubtitleLine[] = [
  {
    id: 1,
    startTime: "00:01:12,000",
    endTime: "00:01:15,500",
    text: "We used to look up at the sky and wonder at our place in the stars.",
    translatedText: "ما در گذشته به آسمان نگاه می‌کردیم و شگفت‌زده جایگاه خود را در میان ستاره‌ها جستجو می‌کردیم."
  },
  {
    id: 2,
    startTime: "00:01:16,000",
    endTime: "00:01:19,200",
    text: "Now we just look down and worry about our place in the dirt.",
    translatedText: "حالا فقط به پایین نگاه می‌کنیم و نگران بقای خودمون روی این خاکستر و گل و لای هستیم."
  },
  {
    id: 3,
    startTime: "00:01:21,300",
    endTime: "00:01:24,800",
    text: "We've forgotten who we are, Cooper. Explorers, pioneers...",
    translatedText: "ما فراموش کردیم که چه کسانی هستیم، کوپر. ما کاوشگر بودیم، پیشگام بودیم..."
  },
  {
    id: 4,
    startTime: "00:01:25,100",
    endTime: "00:01:27,500",
    text: "Not caretakers.",
    translatedText: "نه فقط یک مشت نگهبان ساده و منفعل."
  },
  {
    id: 5,
    startTime: "00:01:30,000",
    endTime: "00:01:34,000",
    text: "This world is a treasure, but it's been telling us to leave for a while now.",
    translatedText: "این دنیا یک گنجینه گرانبهاست، اما مدتی هست که داره به ما می‌فهمونه اینجا رو ترک کنیم."
  },
  {
    id: 6,
    startTime: "00:01:35,500",
    endTime: "00:01:38,200",
    text: "Mankind was born on Earth. It was never meant to die here.",
    translatedText: "بشریت روی زمین متولد شد، اما هرگز قرار نبود همین‌جا بمیره و نابود بشه."
  }
];

export default function App() {
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  useEffect(() => {
    validateOllamaConnection();
  }, []);
  // Core State
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("persian_sub_model") || "llama3.1";
  });
  const [provider, setProvider] = useState<"ollama" | "cerebras">(() => {
    return (localStorage.getItem("persian_sub_provider") as any) || "ollama";
  });
  const [cerebrasApiKey, setCerebrasApiKey] = useState<string>(() => {
    return localStorage.getItem("cerebras_api_key") || "";
  });
  const [isCerebrasConfigOpen, setIsCerebrasConfigOpen] = useState(false);

  const changeModel = (val: string) => {
    setSelectedModel(val);
    localStorage.setItem("persian_sub_model", val);
  };
  const changeProvider = (val: "ollama" | "cerebras") => {
    setProvider(val);
    localStorage.setItem("persian_sub_provider", val);
    if (val === "cerebras") {
      setAvailableModels([{name: "llama3.1-8b"}]);
      setSelectedModel("llama3.1-8b");
    } else {
      validateOllamaConnection();
    }
  };

  const [openSubtitlesApiKey, setOpenSubtitlesApiKey] = useState<string>(() => {
    return localStorage.getItem("opensubtitles_api_key") || "";
  });
  const [isOpenSubtitlesConfigOpen, setIsOpenSubtitlesConfigOpen] = useState(false);
  const changeApiKey = (val: string) => {
    setOpenSubtitlesApiKey(val);
    localStorage.setItem("opensubtitles_api_key", val);
  };
  const [selectedEngines, setSelectedEngines] = useState({
    opensubtitles: true,
    subscene: true,
    yify: true,
    addic7ed: true,
    google: false
  });

  const toggleEngine = (engine: keyof typeof selectedEngines) => {
    setSelectedEngines(prev => ({ ...prev, [engine]: !prev[engine] }));
  };
  const [remainingTokens, setRemainingTokens] = useState<string | null>(null);
  const [movieName, setMovieName] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SubtitleSearchResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>("");
  
  // Custom manual pasting state
  const [pastedText, setPastedText] = useState<string>("");
  const [showPasteArea, setShowPasteArea] = useState<boolean>(false);

  // Translation configuration
  const [preserveTiming, setPreserveTiming] = useState<boolean>(true);
  const [naturalLocalization, setNaturalLocalization] = useState<boolean>(true);
  const [contextAwareMode, setContextAwareMode] = useState<boolean>(true);

  // App Utilities / Progress States
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isAutocorrecting, setIsAutocorrecting] = useState<boolean>(false);
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [autocorrectProgress, setAutocorrectProgress] = useState<number>(0);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Collapsible settings & validation state
  const [isApiConfigOpen, setIsApiConfigOpen] = useState<boolean>(true);
  const [isValidatingKey, setIsValidatingKey] = useState<boolean>(false);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save logic removed since API Key is not needed

  // Handle Drag Events for subtitle imports
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".srt")) {
      setError("فرمت فایل نامعتبر است. لطفا فقط فایل srt. بارگذاری کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = parseSRT(content);
        if (parsed.length === 0) {
          setError("فایل خالی است یا فرمت SRT آن نامعتبر می‌باشد.");
          return;
        }
        setSubtitles(parsed);
        setActiveIndex(null);
        setSuccess(`زیرنویس فایل "${file.name}" با موفقیت بارگذاری شد (${parsed.length} خط).`);
      } catch (err) {
        setError("خطایی در تحلیل فایل زیرنویس رخ داد.");
      }
    };
    reader.readAsText(file);
  };

  // Process pasted subtitles manually
  const handlePasteSubmit = () => {
    setError(null);
    if (!pastedText.trim()) {
      setError("لطفا متن زیرنویس را در کادر وارد کنید.");
      return;
    }
    try {
      const parsed = parseSRT(pastedText);
      if (parsed.length === 0) {
        setError("فرمت متن وارد شده معتبر نیست. لطفا مطمئن شوید قالب بندی SRT رعایت شده است.");
        return;
      }
      setSubtitles(parsed);
      setActiveIndex(null);
      setShowPasteArea(false);
      setPastedText("");
      setSuccess(`تعداد ${parsed.length} خط زیرنویس به صورت دستی وارد و بارگذاری شد.`);
    } catch (err) {
      setError("خطا در پردازش متن دستی وارد شده.");
    }
  };

  // Search online subtitles for movie/video
  const handleMovieSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieName.trim()) {
      setError("لطفا نام فیلم یا ویدیو را وارد کنید.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedResultId(null);

    try {
      const response = await fetch("/api/search-subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieName, apiKey: openSubtitlesApiKey, engines: selectedEngines }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "خطایی در برقراری ارتباط با سرور رخ داد.");
      }

      const data = await response.json();
      if (data.success && data.results) {
        setSearchResults(data.results);
        setSuccess(`نتایج جستجو برای "${movieName}" یافت شد. نسخه مورد نظر خود را انتخاب کنید.`);
      } else {
        setError("زیرنویسی یافت نشد.");
      }
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با سرور برای جستجوی زیرنویس.");
    } finally {
      setIsSearching(false);
    }
  };

  // Load a subtitle version from search results
  const loadSearchResult = async (result: SubtitleSearchResult) => {
    if (result.source === "موتور جستجوی عمومی (Free Web)" && result.lines) {
      setSubtitles(result.lines);
      setSelectedResultId(result.id);
      setActiveIndex(null);
      setSuccess(`زیرنویس نسخه "${result.fileName}" بارگذاری شد.`);
      return;
    }
    if (!openSubtitlesApiKey) {
       setError("کلید API وارد نشده است. برای دانلود از OpenSubtitles نیاز به کلید دارید.");
       return;
    }
    setIsSearching(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/download-subtitle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: result.fileId, apiKey: openSubtitlesApiKey })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "خطا در دانلود زیرنویس");
      }
      const data = await response.json();
      if (data.success && data.fileContent) {
        const parsed = parseSRT(data.fileContent);
        setSubtitles(parsed);
        setSelectedResultId(result.id);
        setActiveIndex(null);
        setSuccess(`زیرنویس نسخه "${result.fileName}" دانلود و بارگذاری شد.`);
      }
    } catch (err: any) {
      setError(err.message || "خطا در دریافت فایل زیرنویس.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTranslateWithAI = async () => {
    if (subtitles.length === 0) {
      setError("هیچ زیرنویسی برای ترجمه بارگذاری نشده است.");
      return;
    }

    setIsTranslating(true);
    setTranslationProgress(0);
    setError(null);
    setSuccess(null);

    const batchSize = 35;
    const totalLines = subtitles.length;
    let updatedSubtitles = [...subtitles];

    try {
      for (let i = 0; i < totalLines; i += batchSize) {
        const chunk = subtitles.slice(i, i + batchSize);
        
        const subtitleLinesPrompt = chunk.map((s: any) => `Line ${s.id}: "${s.text}"`).join("\n");
        const systemInstruction = `You are a professional cinematic subtitle translator and localization engine.\nYou will translate movie subtitles into natural Iranian Persian (Farsi - فارسی روان ایرانی).\n\nCRITICAL RULES:\n1. DO NOT translate line-by-line in isolation.\n2. ALWAYS group every 2 to 3 consecutive subtitle lines together as one unified semantic unit/chunk, translate them together to capture the full context, and then split the resulting translation back into the individual original line IDs.\n3. Preserve subtitle TIMING and sync EXACTLY (do not merge, delete, or re-order lines).\n4. Translate in CONTEXT-AWARE mode (not literal translation). Understand dialogue as part of a scene, preserving emotional tone, sarcasm, humor, and tension.\n5. Maintain character voice consistency and keep names, places, and proper nouns consistent.\n6. The output must be natural Iranian spoken Persian (not formal/book language) of movie-quality localization (like professional Netflix dubbing subtitles).\n7. Return the response STRICTLY as a JSON object with a \translations key containing an array of objects with keys \id (integer matching the input) and \translatedText (string). Do not include any explanations or markdown outside the JSON structure.\n\nResponse JSON Schema structure:\n{\n  "translations": [\n    { "id": 1, "translatedText": "متن ترجمه شده به فارسی روان" }\n  ]\n}`;

        const response = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: `Translate the following consecutive subtitle lines using the 2-3 line semantic chunking strategy:\n\n${subtitleLinesPrompt}` }
            ],
            stream: false,
            format: "json",
           provider, cerebrasApiKey }),
        });

        if (!response.ok) {
          throw new Error("خطا در ترجمه دسته اول زیرنویس‌ها با Ollama.");
        }

        const data = await response.json();
        const content = data.message?.content || "{}";
        let parsedData: any = {};
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (e) { console.error("Parse Error"); }

        if (data.message && data.message.remainingTokens) {
    setRemainingTokens(data.message.remainingTokens);
  }
  const translatedResults = parsedData.translations || [];
        if (translatedResults.length > 0) {
          translatedResults.forEach((translatedItem: any) => {
            const index = updatedSubtitles.findIndex(item => item.id === translatedItem.id);
            if (index !== -1) {
              updatedSubtitles[index] = { ...updatedSubtitles[index], translatedText: translatedItem.translatedText };
            }
          });
        }

        setSubtitles([...updatedSubtitles]);
        setTranslationProgress(Math.min(100, Math.round(((i + batchSize) / totalLines) * 100)));
      }
      setSuccess("فرآیند ترجمه هوشمند در تمام خطوط با موفقیت به پایان رسید.");
    } catch (err: any) {
      setError(err.message || "خطا در ترجمه.");
    } finally {
      setIsTranslating(false);
      setTranslationProgress(100);
    }
  };

  const handleAutocorrectWithAI = async () => {
    if (subtitles.length === 0) {
      setError("هیچ زیرنویسی برای اصلاح بارگذاری نشده است.");
      return;
    }

    setIsAutocorrecting(true);
    setAutocorrectProgress(0);
    setError(null);
    setSuccess(null);

    const batchSize = 35;
    const totalLines = subtitles.length;
    let updatedSubtitles = [...subtitles];

    try {
      for (let i = 0; i < totalLines; i += batchSize) {
        const chunk = subtitles.slice(i, i + batchSize);
        
        const subtitleLinesPrompt = chunk.map((s: any) => `Line ${s.id}: "${s.translatedText || s.text}"`).join("\n");
        const systemInstruction = `You are a Persian language expert. Your task is to correct the orthography, punctuation, and half-spaces (نیم‌فاصله) of the provided Persian subtitle lines.\nCRITICAL RULES:\n1. DO NOT change the meaning or translate the text. Only correct grammar, punctuation, and typography (e.g., changing spaces to half-spaces where appropriate like "می روم" to "می‌روم").\n2. Return the response STRICTLY as a JSON object with a \corrections key containing an array of objects with keys \id (integer matching the input) and \correctedText (string). Do not include any explanations.\n\nResponse JSON Schema structure:\n{\n  "corrections": [\n    { "id": 1, "correctedText": "متن اصلاح‌شده با نیم‌فاصله‌ها" }\n  ]\n}`;

        const response = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: `Correct the following Persian subtitle lines:\n\n${subtitleLinesPrompt}` }
            ],
            stream: false,
            format: "json",
           provider, cerebrasApiKey }),
        });

        if (!response.ok) {
          throw new Error("خطا در اصلاح دسته اول زیرنویس‌ها با Ollama.");
        }

        const data = await response.json();
        const content = data.message?.content || "{}";
        let parsedData: any = {};
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (e) { console.error("Parse Error"); }

        if (data.message && data.message.remainingTokens) {
    setRemainingTokens(data.message.remainingTokens);
  }
  const correctedResults = parsedData.corrections || [];
        if (correctedResults.length > 0) {
          correctedResults.forEach((correctedItem: any) => {
            const index = updatedSubtitles.findIndex(item => item.id === correctedItem.id);
            if (index !== -1) {
              updatedSubtitles[index] = { ...updatedSubtitles[index], text: updatedSubtitles[index].text, translatedText: correctedItem.correctedText };
            }
          });
        }

        setSubtitles([...updatedSubtitles]);
        setAutocorrectProgress(Math.min(100, Math.round(((i + batchSize) / totalLines) * 100)));
      }
      setSuccess("فرآیند اصلاح خودکار نگارشی با موفقیت به پایان رسید.");
    } catch (err: any) {
      setError(err.message || "خطا در اصلاح نیم‌فاصله‌ها.");
    } finally {
      setIsAutocorrecting(false);
      setAutocorrectProgress(100);
    }
  };

  // Inline editing handler
  const handleTextEdit = (id: number, text: string) => {
    setSubtitles(prev => prev.map(item => item.id === id ? { ...item, translatedText: text } : item));
  };

  // Export translated SRT
  const handleDownloadSRT = () => {
    try {
      const srtString = stringifySRT(subtitles, true);
      const blob = new Blob([srtString], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Persian_${movieName ? movieName.replace(/\s+/g, "_") : "Subtitle"}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccess("فایل زیرنویس فارسی (SRT) با موفقیت دانلود شد.");
    } catch (err) {
      setError("خطا در ایجاد و دانلود فایل زیرنویس.");
    }
  };

  // Export original language SRT
  const handleDownloadOriginalSRT = () => {
    try {
      const srtString = stringifySRT(subtitles, false);
      const blob = new Blob([srtString], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Original_${movieName ? movieName.replace(/\s+/g, "_") : "Subtitle"}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccess("فایل زیرنویس اصلی (SRT) با موفقیت دانلود شد.");
    } catch (err) {
      setError("خطا در ایجاد و دانلود فایل زیرنویس اصلی.");
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    try {
      const srtString = stringifySRT(subtitles, true);
      navigator.clipboard.writeText(srtString);
      setSuccess("کل متن زیرنویس فارسی در حافظه موقت سیستم کپی شد.");
    } catch (err) {
      setError("خطا در کپی متن زیرنویس.");
    }
  };

  // Calculate statistics
  const totalSubCount = subtitles.length;
  const translatedSubCount = subtitles.filter(s => s.translatedText && s.translatedText.trim() !== "").length;
  const translationPercentage = totalSubCount > 0 ? Math.round((translatedSubCount / totalSubCount) * 100) : 0;

  // Filtered subtitle rows for inside the editor search feature
  const filteredSubtitles = subtitles.filter(sub => {
    if (!filterQuery) return true;
    const query = filterQuery.toLowerCase();
    const originalMatch = sub.text.toLowerCase().includes(query);
    const translatedMatch = sub.translatedText?.toLowerCase().includes(query) || false;
    return originalMatch || translatedMatch;
  });

  // Validate Ollama connection with the Express server
  const validateCerebrasConnection = async () => {
    setIsValidatingKey(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/validate-cerebras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cerebrasApiKey })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.models) {
           setAvailableModels(data.models);
           if (data.models.length > 0 && !data.models.find((m: any) => m.name === selectedModel)) {
             setSelectedModel(data.models[0].name);
           }
        }
        setSuccess("ارتباط با Cerebras با موفقیت تایید شد.");
        setIsCerebrasConfigOpen(false);
      } else {
        setError(data.error || "کلید نامعتبر است.");
      }
    } catch (err: any) {
      setError("خطا در سنجش Cerebras.");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const validateOllamaConnection = async () => {
    setIsValidatingKey(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (!res.ok) throw new Error("Ollama is not responding.");
      const data = await res.json();
      if (data.models) {
        setAvailableModels(data.models);
        if (data.models.length > 0 && !data.models.find((m: any) => m.name === selectedModel)) {
          setSelectedModel(data.models[0].name);
        }
      }
      setSuccess("ارتباط با Ollama با موفقیت برقرار شد. مدل‌ها دریافت شدند.");
      setIsApiConfigOpen(false);
    } catch (err: any) {
      setError("خطا در اتصال به Ollama. مطمئن شوید برنامه در حال اجراست و متغیر OLLAMA_ORIGINS=\"*\" تنظیم شده است.");
    } finally {
      setIsValidatingKey(false);
    }
  };
  // Clear/End Subtitle Search
  const handleClearSearch = () => {
    setMovieName("");
    setSearchResults([]);
    setSelectedResultId(null);
    setError(null);
  };

  // Reset function to clear cache except for API Key
  const handleResetCache = () => {
    setMovieName("");
    setSearchResults([]);
    setSelectedResultId(null);
    setSubtitles([]);
    setActiveIndex(null);
    setFilterQuery("");
    setPastedText("");
    setShowPasteArea(false);
    setError(null);
    setSuccess("حافظه موقت و لیست زیرنویس‌ها پاکسازی شدند.");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans pb-16 bg-[#041116] selection:bg-amber-500 selection:text-slate-900">
      {/* Cinematic Persepolis (Takht-e Jamshid) Background Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-overlay bg-cover bg-center blur-[2px]"
        style={{ backgroundImage: `url(${persepolisBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-[#020a0d] via-[#041116]/85 to-[#020a0d]/95 z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 sm:pt-10">
        
        {/* Banner Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 flex items-center gap-3 p-4 bg-red-950/65 border border-red-800/80 rounded-3xl text-red-200 shadow-xl backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-sm font-medium">{error}</div>
              <button onClick={() => setError(null)} className="mr-auto text-xs bg-red-900/40 hover:bg-red-800/60 px-3 py-1 rounded-xl transition-all">بستن</button>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 flex items-center gap-3 p-4 bg-teal-950/65 border border-teal-800/80 rounded-3xl text-teal-100 shadow-xl backdrop-blur-md"
            >
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="text-sm font-medium">{success}</div>
              <button onClick={() => setSuccess(null)} className="mr-auto text-xs bg-teal-900/40 hover:bg-teal-800/60 px-3 py-1 rounded-xl transition-all">بستن</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navbar / Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-teal-900/20">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-3xl bg-gradient-to-tr from-teal-600 to-amber-700 flex items-center justify-center shadow-lg shadow-teal-500/20 overflow-hidden border border-teal-400/30">
              {/* Persian Geometric Pattern Overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="50,0 60,35 100,50 60,65 50,100 40,65 0,50 40,35" fill="currentColor" className="text-white" />
                <polygon points="15,15 50,25 85,15 75,50 85,85 50,75 15,85 25,50" fill="none" stroke="currentColor" strokeWidth="2" className="text-white" />
              </svg>
              <Languages className="w-6 h-6 text-white relative z-10" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-white via-amber-100 to-amber-300 flex items-center gap-3">
                <span>زیرنویس‌یاب و مترجم پارسی</span>
                <span className="text-[10px] font-bold bg-teal-900/50 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full shadow-inner">الگوریتم هوشمند</span>
              </h1>
              <p className="text-xs text-teal-500/70 tracking-widest font-mono mt-1 font-semibold uppercase">Persian Subtitle Finder & AI Translator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleResetCache}
              className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 px-3 py-1.5 rounded-3xl transition-all cursor-pointer font-bold active:scale-95"
              title="پاکسازی زیرنویس‌ها و تنظیمات موقت"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>بازنشانی حافظه موقت</span>
            </button>
            <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-3xl font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>موتور محلی: آماده به کار</span>
            </span>
            <div className="text-xs text-slate-400 text-left bg-white/5 border border-teal-900/20 px-3 py-1.5 rounded-3xl">
              <span className="font-mono text-slate-300">نسخه ۱.۲.۰ (Local Client)</span>
            </div>
          </div>
        </header>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Right Column: Settings, Search & Import Panels (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Panel 1: API Config Panel */}
            <section id="api-config" className="bg-[#06151c]/70 backdrop-blur-xl border border-teal-900/30 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 rounded-full blur-2xl group-hover:bg-teal-600/10 transition-all pointer-events-none" />
              
              <div 
                className="flex items-center justify-between mb-2 pb-3 border-b border-teal-900/20 cursor-pointer"
                onClick={() => setIsApiConfigOpen(!isApiConfigOpen)}
                title="کلیک کنید تا کادر تنظیمات جمع یا باز شود"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  <span>تنظیمات هوش مصنوعی</span>
                  {!isApiConfigOpen && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      آماده
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">{selectedModel}</span>
                  <span className="text-xs text-slate-500 transition-transform duration-250">{isApiConfigOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isApiConfigOpen ? (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="p-4 rounded-3xl border bg-teal-950/20 border-teal-500/50 shadow-lg shadow-teal-500/5 flex flex-col gap-3">
                    
                    {/* Provider Selection */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">انتخاب سرویس هوش مصنوعی:</span>
                      <select 
                        value={provider} 
                        onChange={(e) => changeProvider(e.target.value as any)} 
                        className="bg-black/40 border border-teal-900/30 text-xs text-teal-300 rounded-3xl px-2.5 py-1.5 outline-none"
                      >
                        <option value="ollama">Ollama (Local)</option>
                        <option value="cerebras">Cerebras (Fast API)</option>
                      </select>
                    </div>

                    {provider === "cerebras" && (
                      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-teal-500/20">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsCerebrasConfigOpen(!isCerebrasConfigOpen)}>
                          <span className="text-[10px] font-bold text-slate-400">کلید API برای Cerebras</span>
                          <button type="button" className="text-teal-400 text-xs">{isCerebrasConfigOpen ? "بستن" : "تنظیم کلید"}</button>
                        </div>
                        {isCerebrasConfigOpen && (
                          <div className="flex flex-col gap-2 mt-1">
                            <input 
                              type="password" 
                              value={cerebrasApiKey} 
                              onChange={(e) => {
                                setCerebrasApiKey(e.target.value);
                                localStorage.setItem("cerebras_api_key", e.target.value);
                              }} 
                              placeholder="YOUR_CEREBRAS_API_KEY"
                              className="w-full bg-black/40 border border-teal-900/30 text-xs text-white rounded-3xl px-3 py-1.5 outline-none focus:border-teal-500 font-mono"
                            />
                            <button 
                              type="button" 
                              onClick={validateCerebrasConnection} 
                              disabled={isValidatingKey} 
                              className="bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 text-[10px] py-1.5 px-3 rounded-3xl transition-all"
                            >
                              {isValidatingKey ? "در حال بررسی..." : "ذخیره و اعتبارسنجی اتصال"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-teal-500/20">
                       <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                         <span className="text-[11px] font-bold text-white">مدل فعال:</span>
                       </div>
                       <select
                         value={selectedModel}
                         onChange={(e) => changeModel(e.target.value)}
                         className="bg-black/60 border border-teal-900/30 text-[11px] text-white rounded-3xl px-2 py-1 outline-none max-w-[150px]"
                       >
                         {availableModels.length > 0 ? (
                           availableModels.map((m: any) => (
                             <option key={m.name} value={m.name}>{m.name}</option>
                           ))
                         ) : (
                           <option value={selectedModel}>{selectedModel}</option>
                         )}
                       </select>
                     </div>

                     {provider === "ollama" && (
                       <button
                         type="button"
                         onClick={validateOllamaConnection}
                         disabled={isValidatingKey}
                         className="w-full mt-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 hover:text-teal-300 border border-teal-500/30 font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer"
                       >
                         {isValidatingKey ? (
                           <RefreshCw className="w-3 h-3 animate-spin" />
                         ) : (
                           <CheckCircle2 className="w-3.5 h-3.5" />
                         )}
                         <span>بررسی وضعیت Ollama</span>
                       </button>
                     )}
                     
                     {provider === "cerebras" && remainingTokens && (
                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-teal-500/20 text-[10px]">
                          <span className="font-bold text-slate-400">موجودی توکن (دقیقه):</span>
                          <span className="text-amber-300 font-mono">{remainingTokens}</span>
                        </div>
                     )}

                   </div>
                </div>
              ) : (
                <div className="text-center mt-2.5">
                  <button 
                    type="button"
                    onClick={() => setIsApiConfigOpen(true)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold hover:underline transition-all"
                  >
                    برای باز کردن تنظیمات موتور کلیک کنید
                  </button>
                </div>
              )}
            </section>

            {/* Panel 2: Subtitle Search Panel (MAIN FEATURE) */}
            <section className="bg-[#06151c]/70 backdrop-blur-xl border border-teal-900/30 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 rounded-full blur-2xl group-hover:bg-teal-600/10 transition-all pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 border-b border-teal-900/20 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-teal-400" />
                  <span>جستجوگر آنلاین زیرنویس</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Subtitle Search</span>
              </div>

              <form onSubmit={handleMovieSearch} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">نام فیلم یا ویدیوی مورد نظر</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input 
                        type="text" 
                        placeholder="نام فیلم یا ویدیو را به انگلیسی یا فارسی وارد کنید..." 
                        value={movieName}
                        onChange={(e) => setMovieName(e.target.value)}
                        className="w-full bg-black/30 border border-teal-900/30 rounded-3xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-3xl flex items-center gap-1.5 transition-all shadow-lg shadow-teal-600/20 active:scale-95 cursor-pointer shrink-0"
                    >
                      {isSearching ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>جستجو</span>
                    </button>
                    {(movieName || searchResults.length > 0) && (
                      <button 
                        type="button"
                        onClick={handleClearSearch}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 px-3 py-2.5 rounded-3xl transition-all cursor-pointer font-bold active:scale-95 text-xs shrink-0 flex items-center gap-1"
                        title="پاکسازی نتایج و پایان فرآیند جستجو"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>پایان جستجو</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-3xl border border-teal-900/20">
      <div className="flex flex-col gap-2 border-b border-teal-900/30 pb-2 mb-1">
        <span className="text-[10px] font-bold text-slate-400">موتورهای جستجو (متصل به اینترنت):</span>
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={selectedEngines.opensubtitles} onChange={() => toggleEngine('opensubtitles')} className="accent-teal-500 w-3 h-3" /> OpenSubtitles
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors font-semibold text-teal-400">
            <input type="checkbox" checked={selectedEngines.google} onChange={() => toggleEngine('google')} className="accent-teal-500 w-3 h-3" /> جستجوی عمومی وب (بدون نیاز به کلید API)
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpenSubtitlesConfigOpen(!isOpenSubtitlesConfigOpen)}>
        <span className="text-[10px] font-bold text-slate-400">کلید API برای OpenSubtitles.com</span>
        <button type="button" className="text-teal-400 text-xs">{isOpenSubtitlesConfigOpen ? "بستن" : "تنظیم"}</button>
      </div>
      {isOpenSubtitlesConfigOpen && (
        <div className="flex flex-col gap-2 mt-2">
          <input 
            type="password" 
            value={openSubtitlesApiKey} 
            onChange={(e) => changeApiKey(e.target.value)} 
            placeholder="YOUR_OPENSUBTITLES_API_KEY"
            className="w-full bg-black/40 border border-teal-900/30 text-xs text-white rounded-3xl px-3 py-1.5 outline-none focus:border-teal-500 font-mono"
          />
          <div className="flex justify-between items-center">
             <a href="https://www.opensubtitles.com/en/consumers" target="_blank" rel="noreferrer" className="text-[9px] text-teal-400 hover:underline">دریافت رایگان کلید</a>
             <button type="button" onClick={() => setIsOpenSubtitlesConfigOpen(false)} className="bg-teal-600 hover:bg-teal-500 text-white text-[10px] py-1 px-3 rounded-3xl">ذخیره و بستن</button>
          </div>
        </div>
      )}
    </div>
              </form>

              {/* Search Results Display */}
              {searchResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-teal-900/20 flex flex-col gap-2.5">
                  <div className="text-xs font-bold text-slate-300">نتایج زیرنویس یافت شده:</div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {searchResults.map((res, idx) => (
                      <div 
                        key={`res-${res.id}-${idx}`}
                        onClick={() => loadSearchResult(res)}
                        className={`p-3 rounded-3xl border text-right transition-all cursor-pointer flex flex-col gap-1.5 ${selectedResultId === res.id ? "bg-teal-950/40 border-teal-500/80 shadow-md" : "bg-black/20 border-teal-900/20 hover:border-teal-500/30"}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-teal-300 line-clamp-1">{res.fileName}</span>
                          <span className="text-[10px] bg-teal-900/40 text-teal-300 px-2 py-0.5 rounded font-medium shrink-0">{res.language}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">دانلودها: {res.downloadCount || "-"}</span>
                            <span className="font-mono">فریم‌ریت: {res.fps || "-"}</span>
                            {res.source && (
                              <span className="bg-white/5 border border-teal-900/30 px-1.5 py-0.5 rounded text-slate-300">
                                منبع: {res.source}
                              </span>
                            )}
                          </div>
                          <span className="text-teal-400 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> انتخاب و بارگذاری
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Panel 3: Subtitle Import Panel */}
            <section className="bg-[#06151c]/70 backdrop-blur-xl border border-teal-900/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-teal-900/20 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-400" />
                  <span>وارد کردن فایل زیرنویس</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Import SRT</span>
              </div>

              {/* Drag & Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? "border-teal-500 bg-teal-500/5" : "border-teal-900/30 hover:border-teal-500/30 bg-black/10"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".srt"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <Upload className="w-8 h-8 text-teal-400 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-200">فایل SRT را بکشید و رها کنید</p>
                <p className="text-[10px] text-slate-500 mt-1">یا جهت جستجوی دستی کلیک کنید</p>
              </div>

              {/* Manual Paste Section Trigger */}
              <div className="mt-3">
                <button 
                  type="button"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="w-full bg-black/30 hover:bg-black/50 border border-teal-900/20 text-[11px] text-slate-300 py-2 rounded-3xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>{showPasteArea ? "بستن کادر درج دستی" : "پیست کردن متن زیرنویس به صورت دستی"}</span>
                </button>
              </div>

              {showPasteArea && (
                <div className="mt-3 flex flex-col gap-2.5">
                  <textarea 
                    rows={6}
                    placeholder="متن کامل زیرنویس با فرمت SRT را در اینجا قرار دهید..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full bg-black/30 border border-teal-900/30 rounded-3xl p-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 outline-none font-mono"
                    dir="ltr"
                  />
                  <button 
                    type="button"
                    onClick={handlePasteSubmit}
                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2 rounded-3xl transition-all"
                  >
                    تجزیه و اعمال زیرنویس دستی
                  </button>
                </div>
              )}
            </section>

          </div>

          {/* Left Column: Translation Config & Editor & Export Section (Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Subtitle Translation Options Panel (Engine controls) */}
            <section className="bg-[#06151c]/70 backdrop-blur-xl border border-teal-900/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-teal-900/20 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  <span>تنظیمات و بهینه‌سازی موتور ترجمه</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Engine Config</span>
              </div>

              {/* Options selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-black/20 p-3 rounded-3xl border border-teal-900/20 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">حفظ دقیق زمان‌بندی</span>
                    <span className="text-[9px] bg-teal-900/40 text-teal-300 px-1 rounded">پیش‌فرض</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">قالب و نشانگرهای زمانی SRT کاملا ایمن باقی می‌مانند.</p>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" checked={preserveTiming} readOnly className="sr-only peer" />
                    <div className="w-8 h-4 bg-teal-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                </div>

                <div className="bg-black/20 p-3 rounded-3xl border border-teal-900/20 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">بومی‌سازی روان فارسی</span>
                    <span className="text-[9px] bg-teal-900/40 text-teal-300 px-1 rounded">روشن</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">ترجمه روان محاوره‌ای ایرانی به جای ترجمه تحت‌اللفظی.</p>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" checked={naturalLocalization} onChange={() => setNaturalLocalization(!naturalLocalization)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                </div>

                <div className="bg-black/20 p-3 rounded-3xl border border-teal-900/20 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">حفظ پیوستگی دیالوگ‌ها</span>
                    <span className="text-[9px] bg-teal-900/40 text-teal-300 px-1 rounded">روشن</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">درک روابط و کنایه‌های بین خطوط پی‌درپی گفتگوها.</p>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" checked={contextAwareMode} onChange={() => setContextAwareMode(!contextAwareMode)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                </div>
              </div>

              {/* Translation Trigger Section */}
              <div className="bg-[#1c1d3c]/30 border border-teal-500/20 rounded-3xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>مجموعاً {totalSubCount} خط آماده‌ی ترجمه است</span>
                  </span>
                  <span className="text-slate-400">پیشرفت کل: <span className="font-mono text-teal-400 font-bold">{translationPercentage}%</span></span>
                </div>

                <button 
                  type="button"
                  disabled={isTranslating || totalSubCount === 0}
                  onClick={handleTranslateWithAI}
                  className="w-full bg-gradient-to-r from-teal-600 to-amber-600 hover:from-teal-500 hover:to-amber-500 disabled:from-teal-900 disabled:to-amber-900 text-white font-bold py-3 px-4 rounded-3xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/10 hover:shadow-teal-600/30 active:scale-[0.99] cursor-pointer"
                >
                  {isTranslating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Languages className="w-5 h-5" />
                  )}
                  <span>ترجمه هوشمند کل زیرنویس با هوش مصنوعی (Farsi translation)</span>
                </button>

                <button 
                  type="button"
                  disabled={isAutocorrecting || totalSubCount === 0 || isTranslating}
                  onClick={handleAutocorrectWithAI}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 border border-teal-900/20 text-slate-300 font-bold py-2.5 px-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer text-xs mt-2"
                >
                  {isAutocorrecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-teal-400" />
                  )}
                  <span>اصلاح خودکار قواعد نگارشی و نیم‌فاصله‌ها با Ollama</span>
                </button>

                {/* Live Progress Bar */}
                {(isTranslating || isAutocorrecting) && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${isTranslating ? translationProgress : autocorrectProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-teal-300">
                      <span>{isTranslating ? "در حال ارسال دسته‌های موازی به مدل..." : "در حال بررسی و اصلاح خطوط..."}</span>
                      <span>{isTranslating ? translationProgress : autocorrectProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Subtitle Editor Section (The centerpiece) */}
            <section className="bg-[#06151c]/70 backdrop-blur-xl border border-teal-900/30 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-900/20 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-bold text-white">ویرایشگر و لیست زمانی خطوط زیرنویس</h2>
                </div>
                
                {/* Statistics chips */}
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-slate-900 text-slate-300 border border-teal-900/20 px-2.5 py-1 rounded-xl">کل خطوط: {totalSubCount}</span>
                  <span className="bg-teal-900/30 text-teal-300 border border-teal-500/20 px-2.5 py-1 rounded-xl">ترجمه شده: {translatedSubCount}</span>
                </div>
              </div>

              {/* Filters & Search inside editor */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                <input 
                  type="text"
                  placeholder="جستجو و فیلتر خطوط بر اساس متن اصلی یا ترجمه..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-black/20 border border-teal-900/20 hover:border-teal-900/30 rounded-3xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* Subtitle Interactive list */}
              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredSubtitles.length === 0 ? (
                  <div className="text-center py-12 bg-black/10 border border-teal-900/20 rounded-3xl flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-slate-600" />
                    <p className="text-xs text-slate-500">هیچ خط زیرنویسی یافت نشد یا موردی بارگذاری نشده است.</p>
                  </div>
                ) : (
                  filteredSubtitles.map((sub, index) => {
                    const isActive = activeIndex === index;
                    return (
                      <div 
                        key={`sub-${sub.id}-${index}`}
                        id={`sub-card-${sub.id}`}
                        onClick={() => setActiveIndex(index)}
                        className={`p-4 rounded-3xl border text-right transition-all duration-200 cursor-text relative overflow-hidden ${
                          isActive 
                            ? "bg-teal-950/20 border-teal-500 shadow-md shadow-teal-500/5 ring-1 ring-teal-500" 
                            : "bg-black/20 border-teal-900/20 hover:bg-white/5 hover:border-teal-900/30"
                        }`}
                      >
                        {/* Glow indicator for active row */}
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-500" />
                        )}

                        <div className="flex justify-between items-center mb-2.5 text-xs text-slate-400">
                          <span className="font-mono text-[10px] bg-black/40 border border-teal-900/20 px-2 py-0.5 rounded text-teal-300">
                            {sub.startTime} ── {sub.endTime}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-400">خط {sub.id}</span>
                        </div>

                        {/* Dialogue original */}
                        <p className="text-slate-300 text-xs font-medium leading-relaxed tracking-wide text-left mb-3 select-all font-mono" dir="ltr">
                          {sub.text}
                        </p>

                        {/* Dialogue Persian translated translation block */}
                        {isActive ? (
                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-teal-900/20">
                            <textarea 
                              rows={2}
                              value={sub.translatedText || ""}
                              onChange={(e) => handleTextEdit(sub.id, e.target.value)}
                              placeholder="ترجمه فارسی این خط را در اینجا وارد یا ویرایش کنید..."
                              className="w-full bg-black/40 text-xs text-white border border-teal-500/40 focus:border-teal-500 rounded-xl p-2.5 outline-none font-sans leading-relaxed text-right"
                              dir="rtl"
                              autoFocus
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-500">برای خروج یا بستن روی بخش‌های دیگر کلیک کنید.</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTextEdit(sub.id, "");
                                  }}
                                  className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-1 rounded hover:bg-red-950/50 transition-all cursor-pointer"
                                >
                                  پاک کردن
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveIndex(null);
                                  }}
                                  className="text-[10px] text-teal-300 bg-teal-950/40 border border-teal-800/40 px-2 py-1 rounded hover:bg-teal-900/40 transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>تایید و ذخیره</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-xs font-sans leading-relaxed pr-1 ${sub.translatedText ? "text-teal-300" : "text-slate-600 italic"}`}>
                            {sub.translatedText || "... در انتظار ترجمه هوشمند ..."}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Export Section (Downloader / Copier) */}
            <section className="bg-[#06151c]/70 backdrop-blur-xl border border-teal-900/30 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-teal-900/20 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>خروجی گرفتن و دانلود زیرنویس نهایی</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Export Suite</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={handleDownloadSRT}
                  disabled={subtitles.length === 0}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-950 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-3xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/10 active:scale-95 cursor-pointer text-xs"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>دانلود فایل نهایی SRT فارسی</span>
                </button>

                <button 
                  type="button"
                  onClick={handleDownloadOriginalSRT}
                  disabled={subtitles.length === 0}
                  className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950 disabled:text-slate-600 border border-teal-900/20 text-slate-200 font-bold py-3 px-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>دانلود زیرنویس اصلی</span>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    const jsonString = JSON.stringify(subtitles, null, 2);
                    const blob = new Blob([jsonString], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `Subtitles_${movieName ? movieName.replace(/\s+/g, "_") : "Data"}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    setSuccess("فایل JSON برای توسعه‌دهندگان با موفقیت دانلود شد.");
                  }}
                  disabled={subtitles.length === 0}
                  className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950 disabled:text-slate-600 border border-teal-900/20 text-slate-200 font-bold py-3 px-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs"
                >
                  <FileJson className="w-4 h-4 text-teal-400" />
                  <span>خروجی JSON</span>
                </button>

                <button 
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={subtitles.length === 0}
                  className="bg-black/30 hover:bg-black/50 border border-teal-900/20 text-slate-300 text-xs font-bold py-3 px-5 rounded-3xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>کپی در کلیپ‌بورد</span>
                </button>
              </div>
            </section>

          </div>

        </div>

        {/* Info guide section */}
        <footer className="mt-12 text-center text-slate-500 text-xs leading-relaxed max-w-2xl mx-auto border-t border-teal-900/20 pt-6 flex flex-col gap-1.5">
          <p className="font-bold text-slate-400">راهنما و ویژگی‌های کلیدی زیرنویس‌یاب هوشمند فارسی</p>
          <p>این برنامه با استفاده از API قدرتمند OpenSubtitles، زیرنویس‌های واقعی و معتبر را برای فیلم و سریال‌های شما پیدا کرده و دانلود می‌کند.</p>
          <p>شما می‌توانید کلید API رایگان خود را از سایت OpenSubtitles دریافت کرده و سپس به کمک مدل‌های قدرتمند Ollama زیرنویس‌ها را به فارسی روان و با در نظر گرفتن لحن و فضای داستان، ترجمه و حتی نیم‌فاصله‌های آن را تصحیح کنید.</p>
          <p className="font-mono text-slate-600 mt-2">© 2026 Persian Subtitle Finder system (OpenSubtitles, Ollama & Cerebras Edition).</p>
        </footer>
      </div>
    </div>
  );
}
