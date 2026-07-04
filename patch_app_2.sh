#!/bin/bash
sed -i '225,256c\
      const response = await fetch("/api/search-subtitles", {\
        method: "POST",\
        headers: { "Content-Type": "application/json" },\
        body: JSON.stringify({ movieName, apiKey: openSubtitlesApiKey }),\
      });\
\
      if (!response.ok) {\
        const errData = await response.json();\
        throw new Error(errData.error || "خطایی در برقراری ارتباط با سرور رخ داد.");\
      }\
\
      const data = await response.json();\
      if (data.success && data.results) {\
        setSearchResults(data.results);\
        setSuccess(`نتایج جستجو برای "${movieName}" یافت شد. نسخه مورد نظر خود را انتخاب کنید.`);\
      } else {\
        setError("زیرنویسی یافت نشد.");\
      }\
    } catch (err: any) {\
      setError(err.message || "خطا در برقراری ارتباط با سرور برای جستجوی زیرنویس.");\
    } finally {\
      setIsSearching(false);\
    }\
  };\
\
  // Load a subtitle version from search results\
  const loadSearchResult = async (result: SubtitleSearchResult) => {\
    if (!openSubtitlesApiKey) {\
       setError("کلید API وارد نشده است.");\
       return;\
    }\
    setIsSearching(true);\
    setError(null);\
    setSuccess(null);\
    try {\
      const response = await fetch("/api/download-subtitle", {\
        method: "POST",\
        headers: { "Content-Type": "application/json" },\
        body: JSON.stringify({ fileId: result.fileId, apiKey: openSubtitlesApiKey })\
      });\
      if (!response.ok) {\
        const errData = await response.json();\
        throw new Error(errData.error || "خطا در دانلود زیرنویس");\
      }\
      const data = await response.json();\
      if (data.success && data.fileContent) {\
        const parsed = parseSRT(data.fileContent);\
        setSubtitles(parsed);\
        setSelectedResultId(result.id);\
        setActiveIndex(null);\
        setSuccess(`زیرنویس نسخه "${result.fileName}" دانلود و بارگذاری شد.`);\
      }\
    } catch (err: any) {\
      setError(err.message || "خطا در دریافت فایل زیرنویس.");\
    } finally {\
      setIsSearching(false);\
    }\
  };' src/App.tsx
