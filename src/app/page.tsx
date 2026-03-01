"use client";

import { useState, useRef, useMemo } from "react";
import { Camera, Wine, Star, DollarSign, Loader2, AlertCircle, ScanLine, ArrowUpDown, Filter } from "lucide-react";
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
  rawPrice: number; // Added for sorting
};

type SortOption = "default" | "score-high" | "price-low";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<WineResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [minScore, setMinScore] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setResults([]);
    setError(null);
    setSortBy("default"); // Reset filters on new scan
    setMinScore(0);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to analyze menu");
      }

      const { wines } = data;
      
      if (!wines || wines.length === 0) {
        setError("No wines detected in the image. Try a clearer photo.");
        return;
      }

      for (const wineName of wines) {
        await new Promise((r) => setTimeout(r, 600)); 
        
        const baseScore = 3.8 + (Math.random() * 1.0);
        const baseRatings = Math.floor(Math.random() * 5000) + 100;
        const rawPrice = Math.floor(Math.random() * 100) + 40;
        
        const wine: WineResult = {
          id: Math.random().toString(36).substring(7),
          name: wineName,
          score: baseScore,
          ratings: (baseRatings / 1000).toFixed(1) + "k",
          price: "$" + rawPrice,
          rawPrice: rawPrice,
        };
        
        setResults((prev) => [...prev, wine]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Memoized sorted and filtered results
  const displayResults = useMemo(() => {
    let filtered = results.filter(w => w.score >= minScore);
    
    if (sortBy === "score-high") {
      filtered.sort((a, b) => b.score - a.score);
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.rawPrice - b.rawPrice);
    }
    
    return filtered;
  }, [results, sortBy, minScore]);

  return (
    <main className="max-w-md mx-auto min-h-[100dvh] p-6 flex flex-col relative overflow-hidden bg-black selection:bg-gold/30">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full aspect-square bg-wine-900/40 blur-[140px] rounded-full pointer-events-none" />

      <header className="py-12 text-center relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-6 shadow-2xl"
        >
          <Wine className="w-8 h-8 text-gold" strokeWidth={1.5} />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-serif text-offwhite tracking-tight"
        >
          Sommelier
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/40 mt-3 font-light tracking-[0.2em] text-xs uppercase"
        >
          Menu Intelligence
        </motion.p>
      </header>

      <section className="flex-1 flex flex-col gap-6 relative z-10">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className={cn(
            "relative overflow-hidden group w-full p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center transition-all duration-500",
            isAnalyzing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:border-gold/30 active:scale-[0.98]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {isAnalyzing ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="relative"
            >
              <ScanLine className="w-12 h-12 text-gold opacity-80" strokeWidth={1} />
            </motion.div>
          ) : (
            <Camera className="w-12 h-12 text-white/60 group-hover:text-gold transition-colors duration-500" strokeWidth={1} />
          )}
          <span className="mt-5 font-serif text-lg tracking-wide text-white/80 group-hover:text-white transition-colors duration-500">
            {isAnalyzing ? "Extracting..." : "Scan Menu"}
          </span>
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-red-950/50 border border-red-900/50 rounded-2xl text-red-200 text-sm font-light backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Controls Toolbar */}
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 p-1"
          >
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1">
              <button 
                onClick={() => setSortBy("default")}
                className={cn("px-4 py-1.5 text-xs font-medium rounded-full transition-colors", sortBy === "default" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80")}
              >
                Scan Order
              </button>
              <button 
                onClick={() => setSortBy("score-high")}
                className={cn("flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors", sortBy === "score-high" ? "bg-white/10 text-gold" : "text-white/50 hover:text-white/80")}
              >
                <ArrowUpDown className="w-3 h-3" /> Score
              </button>
              <button 
                onClick={() => setSortBy("price-low")}
                className={cn("flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors", sortBy === "price-low" ? "bg-white/10 text-gold" : "text-white/50 hover:text-white/80")}
              >
                <DollarSign className="w-3 h-3" /> Price
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 pr-3">
               <button 
                  onClick={() => setMinScore(s => s === 0 ? 4.0 : s === 4.0 ? 4.5 : 0)}
                  className={cn("flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors", minScore > 0 ? "bg-white/10 text-gold" : "text-white/50")}
               >
                 <Filter className="w-3 h-3" /> {minScore === 0 ? "All Scores" : `${minScore}+ Only`}
               </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-4 pb-24">
          <AnimatePresence initial={false} mode="popLayout">
            {displayResults.map((wine, idx) => (
              <motion.div
                layout
                key={wine.id}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="group bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-serif text-lg text-offwhite leading-tight mb-2 group-hover:text-gold transition-colors">{wine.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-white/40 font-medium tracking-wide">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-gold/80 fill-gold/20" />
                      {wine.ratings}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-white/30" />
                      {wine.price}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className="text-3xl font-serif text-gold leading-none">
                    {wine.score.toFixed(1)}
                  </div>
                  <div className="text-[9px] font-sans text-white/30 tracking-[0.2em] uppercase mt-2">
                    Score
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {results.length > 0 && displayResults.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-10 text-white/40 text-sm font-medium tracking-wide"
             >
               No wines match your filters.
             </motion.div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full p-6 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex items-center justify-center gap-3 z-50"
          >
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-[0.15em]">Neural Engine Processing</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
