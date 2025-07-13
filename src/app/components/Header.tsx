"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface HeaderProps {
  showNavigation?: boolean
}

export default function Header({ showNavigation = false }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="sticky top-0 z-50 w-full">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e6edf4] px-4 md:px-10 py-3 md:py-4 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 w-full">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 md:gap-4 text-[#0c151d]">
            <div className="size-6 md:size-7">
              <Image src="/logo.svg" alt="MF Compass Logo" width={32} height={32} className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <Link href="/">
              <h2 className="text-[#0c151d] text-base md:text-lg font-bold leading-tight tracking-[-0.015em] hover:text-[#359dff] transition-colors">
                MF Compass
              </h2>
            </Link>
          </div>
          {/* Desktop Navigation */}
          {showNavigation && (
            <div className="hidden md:flex items-center gap-9">
              <Link
                href="/"
                className="text-[#0c151d] text-sm font-medium leading-normal hover:text-[#359dff] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/funds"
                className="text-[#0c151d] text-sm font-medium leading-normal hover:text-[#359dff] transition-colors"
              >
                Funds
              </Link>
            </div>
          )}
        </div>
        {/* Right: Mobile Menu Button */}
        {showNavigation && (
          <button
            className="md:hidden p-2 text-[#0c151d] hover:text-[#359dff] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {showNavigation && isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#e6edf4] md:hidden">
          <div className="flex flex-col py-2">
            <Link
              href="/"
              className="px-4 py-3 text-[#0c151d] text-sm font-medium hover:bg-slate-50 hover:text-[#359dff] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/funds"
              className="px-4 py-3 text-[#0c151d] text-sm font-medium hover:bg-slate-50 hover:text-[#359dff] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Funds
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
