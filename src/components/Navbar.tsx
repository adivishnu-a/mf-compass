"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sun, Moon, Laptop, Heart, GitCompare, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);

  // Sync counts from localStorage
  const updateCounts = () => {
    try {
      const watchlist = JSON.parse(localStorage.getItem("mfc:watchlist") || "[]");
      setWatchlistCount(watchlist.length);
      
      const compare = JSON.parse(localStorage.getItem("mfc:compare") || "[]");
      setCompareCount(compare.length);
    } catch (e) {
      console.error("Error reading storage counts", e);
    }
  };

  useEffect(() => {
    updateCounts();
    
    // Listen to local storage and custom events
    window.addEventListener("storage", updateCounts);
    window.addEventListener("mfc-watchlist-change", updateCounts);
    window.addEventListener("mfc-compare-change", updateCounts);
    
    return () => {
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("mfc-watchlist-change", updateCounts);
      window.removeEventListener("mfc-compare-change", updateCounts);
    };
  }, []);

  const triggerSearch = () => {
    window.dispatchEvent(new CustomEvent("mfc-open-search"));
  };

  const navLinks = [
    { href: "/funds", label: "Explore Funds" },
    { 
      href: "/watchlist", 
      label: "Watchlist", 
      icon: Heart, 
      count: watchlistCount 
    },
    { 
      href: "/compare", 
      label: "Compare", 
      icon: GitCompare, 
      count: compareCount,
      countMin: 2 // Only show badge if at least 1 or 2? Let's show always if > 0
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img 
            src="/logo-96.png" 
            alt="MF Compass Logo" 
            width={24} 
            height={24} 
            className="h-6 w-6 object-contain"
          />
          <span className="font-heading font-extrabold text-xl tracking-tight text-foreground transition-colors">
            <span className="text-primary group-hover:text-primary/80">MF</span> Compass
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 py-2 text-sm font-medium transition-colors hover:text-foreground/90",
                  isActive 
                    ? "text-foreground font-semibold" 
                    : "text-muted-foreground"
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
                {link.count !== undefined && link.count > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground font-data">
                    {link.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Items */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={triggerSearch}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
            aria-label="Search funds"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium opacity-100 font-data">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-foreground transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === "light" && <Sun className="h-4 w-4" />}
              {theme === "dark" && <Moon className="h-4 w-4" />}
              {theme === "system" && <Laptop className="h-4 w-4" />}
            </button>

            {themeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setThemeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-xl border border-border bg-card/95 p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t);
                        setThemeDropdownOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-colors hover:bg-accent hover:text-foreground",
                        theme === t ? "text-primary font-bold bg-accent/40" : "text-muted-foreground"
                      )}
                    >
                      {t === "light" && <Sun className="h-3.5 w-3.5" />}
                      {t === "dark" && <Moon className="h-3.5 w-3.5" />}
                      {t === "system" && <Laptop className="h-3.5 w-3.5" />}
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-foreground md:hidden transition-colors hover:bg-accent"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 w-full border-b border-border bg-background/95 backdrop-blur-lg shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2 p-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
                    isActive ? "bg-accent/60 text-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.label}
                  </span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground font-data">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
