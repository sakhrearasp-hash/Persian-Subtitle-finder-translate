#!/bin/bash
sed -i '759,778c\
                <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-3xl border border-teal-900/20">\
                  <span className="text-[10px] font-bold text-slate-400">موتور جستجوی OpenSubtitles.com</span>\
                  <div className="flex flex-col gap-1.5">\
                    <label className="text-[10px] text-slate-400">کلید API (جهت دانلود واقعی زیرنویس):</label>\
                    <input \
                      type="password" \
                      value={openSubtitlesApiKey} \
                      onChange={(e) => changeApiKey(e.target.value)} \
                      placeholder="YOUR_OPENSUBTITLES_API_KEY"\
                      className="w-full bg-black/40 border border-teal-900/30 text-xs text-white rounded-3xl px-3 py-1.5 outline-none focus:border-teal-500 font-mono"\
                    />\
                    <a href="https://www.opensubtitles.com/en/consumers" target="_blank" rel="noreferrer" className="text-[9px] text-teal-400 hover:underline">دریافت رایگان کلید API از OpenSubtitles</a>\
                  </div>\
                </div>' src/App.tsx
