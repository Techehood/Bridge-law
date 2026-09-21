"use client";

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes";

export default function EnterpriseHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-[#FDFCFB] dark:bg-neutral-900 transition-colors duration-300 h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold italic text-xl">B</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 leading-none">The Bridge <span className="text-blue-600">V2.0</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 font-medium">Techembrace Strategic Handoff</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
