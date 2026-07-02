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
import persepolisBg from "./assets/images/persepolis_bg_1783007422886.jpg";

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
  // Core State
  const [provider, setProvider] = useState<TranslationProvider>("gemini");
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("persian_sub_gemini_key") || localStorage.getItem("persian_sub_api_key") || "";
  });

  const apiKey = geminiApiKey;

  const changeGeminiKey = (val: string) => {
    setGeminiApiKey(val);
    localStorage.setItem("persian_sub_gemini_key", val);
    localStorage.setItem("persian_sub_api_key", val);
  };
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
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Collapsible settings & validation state
  const [isApiConfigOpen, setIsApiConfigOpen] = useState<boolean>(() => {
    return !localStorage.getItem("persian_sub_api_key");
  });
  const [isValidatingKey, setIsValidatingKey] = useState<boolean>(false);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save API Key to localStorage
  useEffect(() => {
    localStorage.setItem("persian_sub_api_key", apiKey);
  }, [apiKey]);

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
        body: JSON.stringify({ movieName, customKey: apiKey }),
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
  const loadSearchResult = (result: SubtitleSearchResult) => {
    setSubtitles(result.lines);
    setSelectedResultId(result.id);
    setActiveIndex(null);
    setSuccess(`زیرنویس نسخه "${result.fileName}" بارگذاری شد.`);
  };

  // Translate with AI (Line-by-Line or Batch based translation logic)
  const handleTranslateWithAI = async () => {
    if (subtitles.length === 0) {
      setError("هیچ زیرنویسی برای ترجمه بارگذاری نشده است.");
      return;
    }

    setIsTranslating(true);
    setTranslationProgress(0);
    setError(null);
    setSuccess(null);

    const batchSize = 10; // Batch translation to prevent rate limits and maintain context
    const totalLines = subtitles.length;
    let updatedSubtitles = [...subtitles];

    try {
      for (let i = 0; i < totalLines; i += batchSize) {
        const chunk = subtitles.slice(i, i + batchSize);
        
        const response = await fetch("/api/translate-subtitles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtitles: chunk,
            customKey: apiKey,
            contextMode: contextAwareMode,
            localizationMode: naturalLocalization,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "خطا در ترجمه دسته اول زیرنویس‌ها.");
        }

        const data = await response.json();
        if (data.success && data.translatedSubtitles) {
          // Merge translated block
          data.translatedSubtitles.forEach((translatedItem: SubtitleLine) => {
            const index = updatedSubtitles.findIndex(item => item.id === translatedItem.id);
            if (index !== -1) {
              updatedSubtitles[index] = {
                ...updatedSubtitles[index],
                translatedText: translatedItem.translatedText,
              };
            }
          });

          // Iterative updates for a smooth live editing presentation
          setSubtitles([...updatedSubtitles]);
          setTranslationProgress(Math.min(100, Math.round(((i + chunk.length) / totalLines) * 100)));
        }
      }

      setSuccess("ترجمه کل زیرنویس به فارسی روان با موفقیت به پایان رسید!");
    } catch (err: any) {
      setError(err.message || "خطایی در فرآیند ترجمه رخ داد.");
    } finally {
      setIsTranslating(false);
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

  // Validate API key with the Express server
  const validateApiKey = async () => {
    if (!geminiApiKey) {
      setError("لطفاً ابتدا کلید API جمینای خود را وارد کنید.");
      return;
    }
    setIsValidatingKey(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customKey: geminiApiKey }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("سنجش موفقیت‌آمیز بود! کلید API جمینای تایید و فعال شد.");
        localStorage.setItem("persian_sub_gemini_key", geminiApiKey);
        localStorage.setItem("persian_sub_api_key", geminiApiKey);
        setIsApiConfigOpen(false);
      } else {
        setError(data.error || "کلید وارد شده نامعتبر است یا کار نمی‌کند.");
      }
    } catch (err: any) {
      setError("خطا در برقراری ارتباط با سرور برای سنجش کلید.");
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
    setSuccess("حافظه موقت و لیست زیرنویس‌ها پاکسازی شدند (کلید هوش مصنوعی شما جهت آسودگی کار حفظ شد).");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans pb-16 bg-[#0a0f1d] selection:bg-purple-600 selection:text-white">
      {/* Cinematic Persepolis (Takht-e Jamshid) Background Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-15 mix-blend-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${persepolisBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-[#0a0f1d] via-[#0d1225]/90 to-[#070b16]/70 z-0 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 sm:pt-10">
        
        {/* Banner Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 flex items-center gap-3 p-4 bg-red-950/65 border border-red-800/80 rounded-xl text-red-200 shadow-xl backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-sm font-medium">{error}</div>
              <button onClick={() => setError(null)} className="mr-auto text-xs bg-red-900/40 hover:bg-red-800/60 px-3 py-1 rounded-lg transition-all">بستن</button>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 flex items-center gap-3 p-4 bg-purple-950/65 border border-purple-800/80 rounded-xl text-purple-100 shadow-xl backdrop-blur-md"
            >
              <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="text-sm font-medium">{success}</div>
              <button onClick={() => setSuccess(null)} className="mr-auto text-xs bg-purple-900/40 hover:bg-purple-800/60 px-3 py-1 rounded-lg transition-all">بستن</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navbar / Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>زیرنویس‌یاب و مترجم فارسی</span>
                <span className="text-xs font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">هوشمند</span>
              </h1>
              <p className="text-xs text-slate-400 tracking-wide font-mono mt-0.5">Persian Subtitle Finder & AI Translator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleResetCache}
              className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold active:scale-95"
              title="پاکسازی زیرنویس‌ها و تنظیمات موقت (بدون حذف کلید API)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>بازنشانی حافظه موقت</span>
            </button>
            <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>موتور محلی: آماده به کار</span>
            </span>
            <div className="text-xs text-slate-400 text-left bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
              <span className="font-mono text-slate-300">نسخه ۱.۲.۰ (Local Client)</span>
            </div>
          </div>
        </header>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Right Column: Settings, Search & Import Panels (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Panel 1: API Config Panel */}
            <section id="api-config" className="bg-[#12182b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition-all pointer-events-none" />
              
              <div 
                className="flex items-center justify-between mb-2 pb-3 border-b border-white/5 cursor-pointer"
                onClick={() => setIsApiConfigOpen(!isApiConfigOpen)}
                title="کلیک کنید تا کادر تنظیمات جمع یا باز شود"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>تنظیمات هوش مصنوعی</span>
                  {!isApiConfigOpen && geminiApiKey && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      آماده
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">Gemini-1.5-Flash</span>
                  <span className="text-xs text-slate-500 transition-transform duration-250">{isApiConfigOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isApiConfigOpen ? (
                <div className="flex flex-col gap-4 mt-4">
                  {/* Google Gemini Card */}
                  <div className="p-4 rounded-xl border bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">موتور Google Gemini (مدل gemini-1.5-flash)</span>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">فعال</span>
                    </div>
                    
                    <div className="relative mb-2.5">
                      <input 
                        type="password" 
                        placeholder="کلید API جمینای خود را وارد کنید..."
                        value={geminiApiKey}
                        onChange={(e) => changeGeminiKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-all"
                      />
                      {geminiApiKey && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-2.5" />
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={validateApiKey}
                      disabled={isValidatingKey}
                      className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer active:scale-[0.98]"
                    >
                      {isValidatingKey ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>سنجش صحت کلید Gemini</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center mt-2.5">
                  <button 
                    type="button"
                    onClick={() => setIsApiConfigOpen(true)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline transition-all"
                  >
                    برای تغییر کلید API یا تنظیمات کلیک کنید
                  </button>
                </div>
              )}
            </section>

            {/* Panel 2: Subtitle Search Panel (MAIN FEATURE) */}
            <section className="bg-[#12182b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition-all pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
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
                        className="w-full bg-black/30 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20 active:scale-95 cursor-pointer shrink-0"
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
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold active:scale-95 text-xs shrink-0 flex items-center gap-1"
                        title="پاکسازی نتایج و پایان فرآیند جستجو"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>پایان جستجو</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Search Results Display */}
              {searchResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2.5">
                  <div className="text-xs font-bold text-slate-300">نتایج زیرنویس یافت شده:</div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {searchResults.map((res, idx) => (
                      <div 
                        key={`res-${res.id}-${idx}`}
                        onClick={() => loadSearchResult(res)}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1.5 ${selectedResultId === res.id ? "bg-purple-950/40 border-purple-500/80 shadow-md" : "bg-black/20 border-white/5 hover:border-purple-500/30"}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-purple-200 line-clamp-1">{res.fileName}</span>
                          <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded font-medium shrink-0">{res.language}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">تعداد خطوط: {res.linesCount}</span>
                          <span className="text-purple-400 font-semibold flex items-center gap-0.5">
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
            <section className="bg-[#12182b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>وارد کردن فایل زیرنویس</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Import SRT</span>
              </div>

              {/* Drag & Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? "border-purple-500 bg-purple-500/5" : "border-white/10 hover:border-purple-500/30 bg-black/10"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".srt"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <Upload className="w-8 h-8 text-purple-400 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-200">فایل SRT را بکشید و رها کنید</p>
                <p className="text-[10px] text-slate-500 mt-1">یا جهت جستجوی دستی کلیک کنید</p>
              </div>

              {/* Manual Paste Section Trigger */}
              <div className="mt-3">
                <button 
                  type="button"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="w-full bg-black/30 hover:bg-black/50 border border-white/5 text-[11px] text-slate-300 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
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
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-purple-500 outline-none font-mono"
                    dir="ltr"
                  />
                  <button 
                    type="button"
                    onClick={handlePasteSubmit}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-xl transition-all"
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
            <section className="bg-[#12182b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>تنظیمات و بهینه‌سازی موتور ترجمه</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Engine Config</span>
              </div>

              {/* Options selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">حفظ دقیق زمان‌بندی</span>
                    <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1 rounded">پیش‌فرض</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">قالب و نشانگرهای زمانی SRT کاملا ایمن باقی می‌مانند.</p>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" checked={preserveTiming} readOnly className="sr-only peer" />
                    <div className="w-8 h-4 bg-purple-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>

                <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">بومی‌سازی روان فارسی</span>
                    <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1 rounded">روشن</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">ترجمه روان محاوره‌ای ایرانی به جای ترجمه تحت‌اللفظی.</p>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" checked={naturalLocalization} onChange={() => setNaturalLocalization(!naturalLocalization)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>

                <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">حفظ پیوستگی دیالوگ‌ها</span>
                    <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1 rounded">روشن</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">درک روابط و کنایه‌های بین خطوط پی‌درپی گفتگوها.</p>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" checked={contextAwareMode} onChange={() => setContextAwareMode(!contextAwareMode)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>
              </div>

              {/* Translation Trigger Section */}
              <div className="bg-[#1c1d3c]/30 border border-purple-500/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>مجموعاً {totalSubCount} خط آماده‌ی ترجمه است</span>
                  </span>
                  <span className="text-slate-400">پیشرفت کل: <span className="font-mono text-purple-400 font-bold">{translationPercentage}%</span></span>
                </div>

                <button 
                  type="button"
                  disabled={isTranslating || totalSubCount === 0}
                  onClick={handleTranslateWithAI}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-900 disabled:to-indigo-900 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/10 hover:shadow-purple-600/30 active:scale-[0.99] cursor-pointer"
                >
                  {isTranslating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Languages className="w-5 h-5" />
                  )}
                  <span>ترجمه هوشمند کل زیرنویس با هوش مصنوعی (Farsi translation)</span>
                </button>

                {/* Live Progress Bar */}
                {isTranslating && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${translationProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-purple-300">
                      <span>در حال ارسال دسته‌های موازی به مدل...</span>
                      <span>{translationProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Subtitle Editor Section (The centerpiece) */}
            <section className="bg-[#12182b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-bold text-white">ویرایشگر و لیست زمانی خطوط زیرنویس</h2>
                </div>
                
                {/* Statistics chips */}
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-slate-900 text-slate-300 border border-white/5 px-2.5 py-1 rounded-lg">کل خطوط: {totalSubCount}</span>
                  <span className="bg-purple-900/30 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-lg">ترجمه شده: {translatedSubCount}</span>
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
                  className="w-full bg-black/20 border border-white/5 hover:border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              {/* Subtitle Interactive list */}
              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredSubtitles.length === 0 ? (
                  <div className="text-center py-12 bg-black/10 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2">
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
                        className={`p-4 rounded-xl border text-right transition-all duration-200 cursor-text relative overflow-hidden ${
                          isActive 
                            ? "bg-purple-950/20 border-purple-500 shadow-md shadow-purple-500/5 ring-1 ring-purple-500" 
                            : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
                        }`}
                      >
                        {/* Glow indicator for active row */}
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500" />
                        )}

                        <div className="flex justify-between items-center mb-2.5 text-xs text-slate-400">
                          <span className="font-mono text-[10px] bg-black/40 border border-white/5 px-2 py-0.5 rounded text-purple-300">
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
                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                            <textarea 
                              rows={2}
                              value={sub.translatedText || ""}
                              onChange={(e) => handleTextEdit(sub.id, e.target.value)}
                              placeholder="ترجمه فارسی این خط را در اینجا وارد یا ویرایش کنید..."
                              className="w-full bg-black/40 text-xs text-white border border-purple-500/40 focus:border-purple-500 rounded-lg p-2.5 outline-none font-sans leading-relaxed text-right"
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
                                  className="text-[10px] text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded hover:bg-purple-900/40 transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>تایید و ذخیره</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-xs font-sans leading-relaxed pr-1 ${sub.translatedText ? "text-purple-200" : "text-slate-600 italic"}`}>
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
            <section className="bg-[#12182b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>خروجی گرفتن و دانلود زیرنویس نهایی</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">Export Suite</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={handleDownloadSRT}
                  disabled={subtitles.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-950 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/10 active:scale-95 cursor-pointer text-xs"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>دانلود فایل نهایی SRT فارسی</span>
                </button>

                <button 
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={subtitles.length === 0}
                  className="bg-black/30 hover:bg-black/50 border border-white/5 text-slate-300 text-xs font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>کپی در کلیپ‌بورد</span>
                </button>
              </div>
            </section>

          </div>

        </div>

        {/* Info guide section */}
        <footer className="mt-12 text-center text-slate-500 text-xs leading-relaxed max-w-2xl mx-auto border-t border-white/5 pt-6 flex flex-col gap-1.5">
          <p className="font-bold text-slate-400">راهنما و ویژگی‌های کلیدی زیرنویس‌یاب هوشمند فارسی</p>
          <p>امکان جستجوی خودکار زیرنویس‌ها بر اساس نام فیلم، بارگذاری با درگ اند دراپ، ویرایش خط به خط ترجمه با رابط بومی‌سازی شده‌ی جذاب و روان فارسی در این MVP گنجانده شده است.</p>
          <p className="font-mono text-slate-600 mt-2">© 2026 Persian Subtitle Finder system. Powered by Gemini Pro.</p>
        </footer>

      </div>
    </div>
  );
}
