"use client";

import { useState, useRef } from "react";
import { Camera, Wine, Star, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type WineResult = {
  id: string;
  name: string;
  score: number;
  ratings: string;
  price: string;
};

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<WineResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setResults([]);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // 1. Send to Gemini for Extraction
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze menu");

      const { wines } = await response.json();
      
      // 2. Mock individual Vivino lookups for extraction results
      // In production, we'd loop through names and fetch real Vivino data here.
      for (const wineName of wines) {
        await new Promise((r) => setTimeout(r, 600)); // Simulate lookup
        
        // Randomize some realistic scores for the extracted names
        const baseScore = 3.8 + (Math.random() * 1.0);
        const baseRatings = Math.floor(Math.random() * 5000) + 100;
        
        const wine: WineResult = {
          id: Math.random().toString(36).substring(7),
          name: wineName,
          score: baseScore,
          ratings: (baseRatings / 1000).toFixed(1) + "k",
          price: "$" + (Math.floor(Math.random() * 100) + 40),
        };
        
        setResults((prev) => [...prev, wine]);
      }
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Check your API key or image quality.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-neutral-50 p-6 flex flex-col">
      <header className="py-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-red-800 rounded-2xl mb-4 shadow-xl">
          <Wine className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Sommelier</h1>
        <p className="text-neutral-500 mt-2 font-medium">Point, snap, and score.</p>
      </header>

      <section className="flex-1 flex flex-col gap-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className={cn(
            "relative overflow-hidden group w-full p-8 rounded-3xl border-2 border-dashed border-neutral-300 bg-white shadow-sm flex flex-col items-center justify-center transition-all active:scale-95",
            isAnalyzing && "opacity-50 cursor-not-allowed",
            !isAnalyzing && "hover:border-red-800 hover:bg-red-50"
          )}
        >
          {isAnalyzing ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="w-10 h-10 text-red-800" />
            </motion.div>
          ) : (
            <Camera className="w-10 h-10 text-neutral-400 group-hover:text-red-800 transition-colors" />
          )}
          <span className="mt-4 font-bold text-neutral-700 group-hover:text-red-900">
            {isAnalyzing ? "Analyzing Menu..." : "Take a Menu Photo"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </button>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-4 pb-20">
          <AnimatePresence initial={false}>
            {results.map((wine) => (
              <motion.div
                key={wine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-neutral-900 leading-tight">{wine.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      {wine.ratings}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {wine.price}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-black text-red-800 leading-none">
                    {wine.score.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mt-1">
                    Score
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {isAnalyzing && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-neutral-100 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-red-800" />
            <span className="text-sm font-bold text-neutral-700 uppercase tracking-widest text-[10px]">Vision Engine Active</span>
        </div>
      )}
    </main>
  );
}
