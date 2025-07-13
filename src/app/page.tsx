"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        {/* Hero Section */}
        <div className="flex flex-1 justify-center">
          <div className="max-w-6xl w-full px-4 md:px-8 lg:px-16 xl:px-24">
            <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] text-center space-y-6 md:space-y-10 py-8 md:py-0">
              <div className="space-y-4 md:space-y-6 max-w-4xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
                  Mutual Fund
                  <span className="block text-[#0183ff]">Analysis</span>
                  Made Simple
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto px-2">
                  A data-driven platform for discovering, analyzing, and ranking mutual funds based on outperformance
                  over category averages. Built for smart investors who want to make informed decisions using
                  transparent, fresh, automated data.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 px-4">
                <Link href="/funds">
                  <button className="group w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#0183ff] text-white font-semibold rounded-lg hover:bg-[#0066cc] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    <span className="flex items-center justify-center gap-3">
                      Explore Fund Rankings
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* What is MF Compass */}
        <div className="py-12 md:py-20 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
            <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">
                What is <span className="text-[#0183ff]">MF Compass?</span>
              </h2>
              <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto font-light px-2">
                MF Compass is a comprehensive mutual fund data platform that automatically discovers, processes, and
                ranks funds from suggested categories.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              {/* Intelligent Fund Discovery - Blue */}
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Intelligent Fund Discovery</h3>
                <p className="text-sm md:text-base text-slate-600">
                  Automatically finds and filters high-quality, investor-friendly funds from the Kuvera API, focusing on
                  direct plans, growth options, and key equity/hybrid categories.
                </p>
              </div>
              {/* Outperformance-Based Scoring - Green */}
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="3 17 9 11 13 15 21 7" />
                    <polyline points="14 7 21 7 21 14" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Outperformance-Based Scoring</h3>
                <p className="text-sm md:text-base text-slate-600">
                  Ranks funds by how much they beat their category averages, not just absolute returns. Scores are
                  normalized for fair, category-wise comparison and updated automatically.
                </p>
              </div>
              {/* Automated, Always Fresh Data - Yellow */}
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Automated, Always Fresh Data</h3>
                <p className="text-sm md:text-base text-slate-600">
                  NAVs and scores are updated daily and rebuilt monthly using automated workflows. The system ensures
                  only the freshest, most relevant data is shown to users.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why MF Compass? */}
        <div className="py-12 md:py-20 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
            <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">
                Why Choose <span className="text-[#0183ff]">MF Compass?</span>
              </h2>
              <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto font-light px-2">
                MF Compass is designed for investors who want unbiased, transparent, and up-to-date fund analysis.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Category-Aware Rankings</h3>
                <p className="text-sm md:text-base text-slate-600">
                  Funds are compared only within their peer group, so you always see fair, apples-to-apples rankings.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">No Hype, Just Data</h3>
                <p className="text-sm md:text-base text-slate-600">
                  No ads, no commissions, no bias. Just clean, transparent data and scoring.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Open & Automated</h3>
                <p className="text-sm md:text-base text-slate-600">
                  Open-source backend, automated updates, and full transparency in how funds are ranked.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center py-4 md:py-6 border-t border-slate-200 mt-8 md:mt-12">
          <div className="text-xs md:text-sm text-slate-500 max-w-4xl mx-auto px-4">
            <strong>Disclaimer:</strong> Mutual funds are subject to market risks. Read all scheme related documents
            carefully before investing. Past performance does not guarantee future returns. Investment decisions should
            be based on individual risk tolerance and financial objectives.
          </div>
        </div>
      </div>
    </div>
  )
}
