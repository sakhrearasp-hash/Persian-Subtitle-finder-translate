#!/bin/bash
sed -i '1169,1174c\
        <footer className="mt-12 text-center text-slate-500 text-xs leading-relaxed max-w-2xl mx-auto border-t border-teal-900/20 pt-6 flex flex-col gap-1.5">\
          <p className="font-bold text-slate-400">راهنما و ویژگی‌های کلیدی زیرنویس‌یاب هوشمند فارسی</p>\
          <p>این برنامه با استفاده از API قدرتمند OpenSubtitles، زیرنویس‌های واقعی و معتبر را برای فیلم و سریال‌های شما پیدا کرده و دانلود می‌کند.</p>\
          <p>شما می‌توانید کلید API رایگان خود را از سایت OpenSubtitles دریافت کرده و سپس به کمک مدل‌های قدرتمند Ollama زیرنویس‌ها را به فارسی روان و با در نظر گرفتن لحن و فضای داستان، ترجمه و حتی نیم‌فاصله‌های آن را تصحیح کنید.</p>\
          <p className="font-mono text-slate-600 mt-2">© 2026 Persian Subtitle Finder system (OpenSubtitles & Ollama Edition).</p>\
        </footer>' src/App.tsx
