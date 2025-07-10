'use client'
import { useEffect, useState } from 'react'

export default function MobileNotice() {
  const [showMobileNotice, setShowMobileNotice] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia(
        '(max-width: 767px), (pointer: coarse), (hover: none)'
      ).matches
      setShowMobileNotice(isMobile)
    }
  }, [])

  if (showMobileNotice === undefined) return null
  if (!showMobileNotice) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-8 text-center">
      <div className="mb-4 flex items-center justify-center gap-4">
        {/* Mobile Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="7" y="2" width="10" height="20" rx="3" fill="#e0e7ef" stroke="#0183ff" strokeWidth="2"/>
          <circle cx="12" cy="19" r="1" fill="#0183ff" />
        </svg>
        {/* PC Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="4" width="18" height="12" rx="2" fill="#e0e7ef" stroke="#64748b" strokeWidth="2"/>
          <rect x="9" y="18" width="6" height="2" rx="1" fill="#64748b" />
        </svg>
        {/* Laptop Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="4" y="6" width="16" height="10" rx="2" fill="#e0e7ef" stroke="#64748b" strokeWidth="2"/>
          <rect x="2" y="18" width="20" height="2" rx="1" fill="#64748b" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2 text-slate-900">Best Viewed on a PC</h2>
      <p className="text-base text-slate-700 mb-2">For the best experience, please use a desktop or laptop to access this site.</p>
      <p className="text-sm text-slate-500">Mobile support is coming soon!</p>
    </div>
  )
}
