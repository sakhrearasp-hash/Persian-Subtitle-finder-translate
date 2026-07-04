#!/bin/bash
sed -i '790,798c\
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">\
                          <div className="flex items-center gap-2">\
                            <span className="font-mono">دانلودها: {res.downloadCount || "-"}</span>\
                            <span className="font-mono">فریم‌ریت: {res.fps || "-"}</span>\
                            {res.source && (\
                              <span className="bg-white/5 border border-teal-900/30 px-1.5 py-0.5 rounded text-slate-300">\
                                منبع: {res.source}\
                              </span>\
                            )}\
                          </div>' src/App.tsx
