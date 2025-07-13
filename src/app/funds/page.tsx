"use client"

import { useState, useEffect } from "react"
import CategoryTabs from "../components/CategoryTabs"
import FundsTable from "../components/FundsTable"

interface Fund {
  id: number
  kuvera_code: string
  scheme_name: string
  fund_house: string
  fund_house_name: string
  fund_category: string
  fund_type: string
  returns_1d: number | string | null
  returns_1w: number | string | null
  returns_1y: number | string | null
  returns_3y: number | string | null
  returns_5y: number | string | null
  returns_inception: number | string | null
  total_score: number | string | null
  aum: number | string | null
  expense_ratio: number | string | null
  fund_rating: number | string | null
  last_updated: string
}

export default function FundsPage() {
  const [activeCategory, setActiveCategory] = useState("Large Cap Fund")
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFunds = async (category: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/funds?category=${encodeURIComponent(category)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch funds")
      }

      if (result.success) {
        setFunds(result.data)
      } else {
        throw new Error(result.error || "Unknown error occurred")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setFunds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFunds(activeCategory)
  }, [activeCategory])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-6 md:py-12">
          <div className="max-w-7xl w-full px-4 md:px-8 lg:px-16 xl:px-24">
            {/* Page Header */}
            <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Fund <span className="text-[#0183ff]">Rankings</span>
              </h1>
              <p className="text-base md:text-xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto px-2">
                Compare mutual funds across categories using transparent, data-driven scores. All funds are filtered for
                quality, consistency, and performance
              </p>
            </div>

            {/* Category Tabs */}
            <CategoryTabs activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {loading ? (
                <>
                  {/* Mobile Loading Skeleton */}
                  <div className="block md:hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-slate-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-4 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <div className="h-6 bg-slate-200 rounded w-10 animate-pulse"></div>
                            <div className="h-3 bg-slate-100 rounded w-8 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {["1W", "1Y", "3Y"].map((label, j) => (
                            <div key={j} className="text-center">
                              <div className="h-4 bg-slate-200 rounded w-12 mx-auto mb-1 animate-pulse"></div>
                              <div className="h-3 bg-slate-100 rounded w-6 mx-auto animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Loading Skeleton */}
                  <div className="hidden md:block overflow-x-auto animate-pulse">
                    <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="h-7 bg-slate-200 rounded w-56" />
                        <div className="h-5 bg-slate-100 rounded w-32" />
                      </div>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {[...Array(7)].map((_, i) => (
                            <th key={i} className={
                              i === 0 ? "px-6 py-4 text-left" : i === 1 ? "px-4 py-4" : "px-2 py-4"
                            }>
                              <div className={
                                i === 0 ? "h-3 bg-slate-200 rounded w-28" : "h-3 bg-slate-200 rounded w-12 mx-auto"
                              } />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 transition-all duration-500">
                        {[...Array(8)].map((_, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-slate-200 rounded-lg mr-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-56" />
                              </div>
                            </td>
                            <td className="px-4 py-5">
                              <div className="h-6 bg-slate-200 rounded w-16 mx-auto"></div>
                            </td>
                            {[...Array(5)].map((_, j) => (
                              <td key={j} className="px-2 py-5">
                                <div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : error ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4 px-4">
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Funds</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base md:text-lg font-semibold text-slate-900">
                          {(() => {
                            let cat = activeCategory
                            if (cat.toLowerCase().endsWith(" fund")) cat = cat.slice(0, -5)
                            cat = cat.charAt(0).toUpperCase() + cat.slice(1)
                            return cat
                          })()} Funds
                        </h2>
                      </div>
                      <div className="text-xs md:text-sm text-slate-500 font-medium">
                        {funds.length} fund{funds.length === 1 ? "" : "s"} ranked
                      </div>
                    </div>
                  </div>

                  {/* Funds Table */}
                  <FundsTable funds={funds} />
                </>
              )}
            </div>

            {/* Disclaimer */}
            <div className="text-center py-4 md:py-6 border-t border-slate-200 mt-8 md:mt-12">
              <div className="text-xs md:text-sm text-slate-500 max-w-5xl mx-auto px-2">
                <strong>Disclaimer:</strong> Mutual funds are subject to market risks. Read all scheme related documents
                carefully before investing. Past performance does not guarantee future returns. Investment decisions
                should be based on individual risk tolerance and financial objectives.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
