"use client";

import { useState, useRef, useMemo } from "react";
import { Camera, Wine, Star, DollarSign, Loader2, AlertCircle, ScanLine, ArrowUp, ArrowDown, Filter, ChevronDown, SlidersHorizontal, Percent } from "lucide-react";
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
  rawPrice: number;
  valueRatio: number; // Score to Price ratio
};

type SortField = "default" | "score" | "price" | "value";
type SortDirection = "asc" | "desc";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<WineResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Controls State
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("default");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [minScore, setMinScore] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  const fileInputRefCamera = useRef<HTMLInputElement>(null);
  const fileInputRefUpload = useRef<HTMLInputElement>(null);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default direction (desc for score/value, asc for price)
      setSortField(field);
      setSortDir(field === "price" ? "asc" : "desc");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setResults([]);
    setError(null);
    setSortField("default");
    setMinScore(0);
    setMaxPrice(1000);

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
        
        const baseScore = Number((3.5 + (Math.random() * 1.4)).toFixed(1)); // 3.5 to 4.9
        const baseRatings = Math.floor(Math.random() * 5000) + 100;
        const rawPrice = Math.floor(Math.random() * 250) + 40;
        
        // Calculate Value Ratio: Higher is better bang for buck. 
        // Example: 4.5 score / $50 = 0.09. 4.8 score / $250 = 0.019.
        const valueRatio = Number(((baseScore / rawPrice) * 100).toFixed(2));
        
        const wine: WineResult = {
          id: Math.random().toString(36).substring(7),
          name: wineName,
          score: baseScore,
          ratings: (baseRatings / 1000).toFixed(1) + "k",
          price: "$" + rawPrice,
          rawPrice: rawPrice,
          valueRatio: valueRatio,
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

  const displayResults = useMemo(() => {
    let filtered = results.filter(w => w.score >= minScore && w.rawPrice <= maxPrice);
    
    if (sortField !== "default") {
      filtered.sort((a, b) => {
        let valA = a[sortField === "score" ? "score" : sortField === "price" ? "rawPrice" : "valueRatio"];
        let valB = b[sortField === "score" ? "score" : sortField === "price" ? "rawPrice" : "valueRatio"];
        
        if (sortDir === "asc") {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
    }
    
    return filtered;
  }, [results, sortField, sortDir, minScore, maxPrice]);

  return (
    <main className="max-w-md mx-auto min-h-[100dvh] p-6 flex flex-col relative overflow-hidden bg-black selection:bg-gold/30">
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
        <div className="flex gap-3 w-full">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => fileInputRefCamera.current?.click()}
            disabled={isAnalyzing}
            className={cn(
              "relative overflow-hidden group flex-1 p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center transition-all duration-500",
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
                <ScanLine className="w-10 h-10 text-gold opacity-80" strokeWidth={1} />
              </motion.div>
            ) : (
              <Camera className="w-10 h-10 text-white/60 group-hover:text-gold transition-colors duration-500" strokeWidth={1} />
            )}
            <span className="mt-4 font-serif text-base tracking-wide text-white/80 group-hover:text-white transition-colors duration-500">
              Camera
            </span>
          </motion.button>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => fileInputRefUpload.current?.click()}
            disabled={isAnalyzing}
            className={cn(
              "relative overflow-hidden group flex-1 p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center transition-all duration-500",
              isAnalyzing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:border-gold/30 active:scale-[0.98]"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-gold transition-colors duration-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span className="mt-4 font-serif text-base tracking-wide text-white/80 group-hover:text-white transition-colors duration-500">
              Upload
            </span>
          </motion.button>
        </div>

        <input
          ref={fileInputRefCamera}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleUpload}
        />
        
        <input
          ref={fileInputRefUpload}
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

        {/* Advanced Control Panel */}
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl"
          >
            {/* Sort Row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Sort By</span>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors px-2 py-1 bg-white/5 rounded-full"
              >
                <SlidersHorizontal className="w-3 h-3" /> Filters
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleSortToggle("score")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors border", sortField === "score" ? "bg-gold/20 text-gold border-gold/30" : "bg-black/20 text-white/60 border-white/5 hover:bg-white/10")}
              >
                Score {sortField === "score" && (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
              </button>
              <button 
                onClick={() => handleSortToggle("price")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors border", sortField === "price" ? "bg-gold/20 text-gold border-gold/30" : "bg-black/20 text-white/60 border-white/5 hover:bg-white/10")}
              >
                Price {sortField === "price" && (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
              </button>
              <button 
                onClick={() => handleSortToggle("value")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors border", sortField === "value" ? "bg-gold/20 text-gold border-gold/30" : "bg-black/20 text-white/60 border-white/5 hover:bg-white/10")}
              >
                Value {sortField === "value" && (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
              </button>
              <button 
                onClick={() => setSortField("default")}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-full transition-colors border", sortField === "default" ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/40 border-transparent hover:text-white")}
              >
                Clear
              </button>
            </div>

            {/* Expandable Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-4 pt-3 mt-2 border-t border-white/10"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-white/60">
                      <span>Min Score: {minScore.toFixed(1)}</span>
                      <span className="text-gold">{minScore > 0 ? "Filtered" : "Any"}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="4.8" step="0.1" 
                      value={minScore} 
                      onChange={(e) => setMinScore(parseFloat(e.target.value))}
                      className="w-full accent-gold bg-white/10 rounded-full h-1 appearance-none outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pb-1">
                    <div className="flex justify-between items-center text-xs text-white/60">
                      <span>Max Price: {maxPrice === 1000 ? "Any" : "$" + maxPrice}</span>
                      <span className="text-gold">{maxPrice < 1000 ? "Filtered" : "Any"}</span>
                    </div>
                    <input 
                      type="range" 
                      min="30" max="1000" step="10" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="w-full accent-gold bg-white/10 rounded-full h-1 appearance-none outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="space-y-4 pb-24">
          <AnimatePresence initial={false} mode="popLayout">
            {displayResults.map((wine) => (
              <motion.a
                href={`https://www.vivino.com/search/wines?q=${encodeURIComponent(wine.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                layout
                key={wine.id}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="group bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-serif text-lg text-offwhite leading-tight mb-2 group-hover:text-gold transition-colors">{wine.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/40 font-medium tracking-wide">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-gold/80 fill-gold/20" />
                      {wine.ratings}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-white/30" />
                      {wine.price}
                    </span>
                    <span className="flex items-center gap-1 border-l border-white/10 pl-3 text-gold/60" title="Value Ratio (Score ÷ Price * 100)">
                      <Percent className="w-3 h-3" />
                      {wine.valueRatio} Val
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
              </motion.a>
            ))}
          </AnimatePresence>
          {results.length > 0 && displayResults.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-10 text-white/40 text-sm font-medium tracking-wide border border-dashed border-white/10 rounded-2xl"
             >
               No wines match your advanced filters.
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
