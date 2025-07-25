"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"

interface FundData {
  id: number
  kuvera_code: string
  scheme_name: string
  isin: string
  fund_house: string
  fund_house_name: string
  fund_category: string
  fund_type: string
  lump_available: string
  lump_min: number | null
  sip_available: string
  sip_min: number | null
  lock_in_period: number | null
  current_nav: number | string | null
  current_nav_date: string
  t1_nav: number | string | null
  t1_nav_date: string
  returns_1d: number | string | null
  returns_1w: number | string | null
  returns_1y: number | string | null
  returns_3y: number | string | null
  returns_5y: number | string | null
  returns_inception: number | string | null
  returns_date: string
  start_date: string
  expense_ratio: number | string | null
  investment_objective: string
  volatility: number | string | null
  portfolio_turnover: number | string | null
  aum: number | string | null
  fund_rating: number | string | null
  crisil_rating: string
  total_score: number | string | null
  score_updated: string
  last_updated: string
  created_at: string
  fund_managers: Array<{ name: string }>
}

export default function FundDetail() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const params = useParams()
  const fundId = params.id as string
  const [fund, setFund] = useState<FundData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const AMC_LOGO_BASE_URL = process.env.NEXT_PUBLIC_AMC_LOGO_BASE_URL || "https://ik.imagekit.io/cowboypanda/AMC"

  useEffect(() => {
    const fetchFundData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/funds/${fundId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch fund details")
        }

        if (result.success) {
          setFund(result.data)
        } else {
          throw new Error(result.error || "Unknown error occurred")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (fundId) {
      fetchFundData()
    }
  }, [fundId])

  const formatDbTimestamp = (ts?: string, onlyDate = false) => {
    if (!ts) return "--"
    const match = ts.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
    if (!match) return ts
    const [, year, month, day, hour, minute] = match
    if (onlyDate) return `${day}/${month}/${year}`
    let h = Number.parseInt(hour, 10)
    const m = minute
    const ampm = h >= 12 ? "PM" : "AM"
    h = h % 12
    if (h === 0) h = 12
    return `${day}/${month}/${year}, ${h}:${m} ${ampm}`
  }

  const formatValue = (value: number | string | null | undefined, decimals = 2, suffix = "") => {
    if (value === null || value === undefined) return "--"
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      if (isNaN(parsed)) return value
      return parsed.toFixed(decimals) + suffix
    }
    if (typeof value === "number") return value.toFixed(decimals) + suffix
    return "--"
  }

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex flex-1 justify-center py-4 md:py-8">
            <div className="max-w-6xl w-full px-4 md:px-8 lg:px-16 xl:px-24 space-y-6 md:space-y-8">
              {/* Mobile Layout Skeleton */}
              <div className="block md:hidden">
                <div className="py-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-sm animate-pulse flex items-center justify-center flex-shrink-0 overflow-hidden relative" />
                    <div className="flex-1 min-w-0">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex flex-row gap-3 mb-4">
                    <div className="flex-1 rounded-lg flex flex-col items-center justify-center px-4 py-3 min-w-[140px] bg-slate-100">
                      <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="h-8 w-16 bg-blue-200 rounded animate-pulse mb-1"></div>
                      <div className="h-4 w-20 bg-blue-100 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-24 bg-blue-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
                {/* Cards */}
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-4 bg-slate-100 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Layout Skeleton */}
              <div className="hidden md:block">
                <div className="flex items-start justify-between py-8">
                  <div className="flex items-start space-x-6 flex-1">
                    <div className="w-16 h-16 bg-slate-200 rounded-sm animate-pulse flex items-center justify-center flex-shrink-0 overflow-hidden relative" />
                    <div className="space-y-2 flex-1">
                      <div className="h-10 bg-slate-200 rounded-lg w-3/4 animate-pulse"></div>
                      <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="rounded-lg flex flex-col items-end justify-center px-4 py-3 min-w-[160px] bg-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-slate-200 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6 animate-pulse"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full"
                        >
                          <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6 animate-pulse"></div>
                    <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-2 border border-blue-100">
                      <div className="h-10 bg-blue-200 rounded w-16 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-4 bg-blue-100 rounded w-20 mx-auto mb-1 animate-pulse"></div>
                      <div className="h-3 bg-blue-100 rounded w-24 mx-auto animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full"
                        >
                          <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                  <div className="px-6 pt-4 pb-2 bg-white" style={{ marginBottom: "-10px" }}>
                    <div className="h-6 bg-slate-200 rounded w-1/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/6 animate-pulse"></div>
                  </div>
                  <div className="overflow-x-auto px-2 md:px-4">
                    <table className="w-full border-separate border-spacing-y-2 border-spacing-x-0">
                      <tbody>
                        <tr>
                          {[...Array(6)].map((_, i) => (
                            <td key={i} className="px-2 py-2 align-top">
                              <div className="bg-slate-100 rounded-lg flex flex-col items-center justify-center py-2 px-2">
                                <div className="h-6 bg-slate-200 rounded w-12 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-slate-100 rounded w-10 animate-pulse"></div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8">
                  <div className="h-6 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]"
                      >
                        <div className="h-6 bg-slate-200 rounded w-10 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                  <div className="h-6 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3 mt-2 animate-pulse"></div>
                </div>
                <div className="bg-slate-100 rounded-xl p-6 mb-8">
                  <div className="h-5 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

  if (error) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Fund Not Found</h3>
              <p className="text-red-600 text-sm">{error || "The requested fund could not be found"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!fund) {
    // Defensive: If fund is still null, show nothing or a fallback
    return null;
  }

  const formatReturn = (value: number | string | null) => {
    if (value === null || value === undefined) return "--"
    const numericValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(numericValue) || numericValue === 0) return "--"
    return `${numericValue.toFixed(2)}%`
  }

  const getReturnColor = (value: number | string | null) => {
    if (value === null || value === undefined) return "text-slate-900"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(numValue) || numValue === 0) return "text-slate-900"
    return numValue < 0 ? "text-red-600" : "text-green-600"
  }

  const formatCurrency = (value: number | string | null) => {
    if (value === null || value === undefined) return "N/A"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(numValue)) return "N/A"
    return `₹${numValue.toLocaleString()}`
  }

  const formatAUM = (aum: number | string | null) => {
    if (aum === null || aum === undefined) return "--"
    const numValue = typeof aum === "string" ? Number.parseFloat(aum) : aum
    if (isNaN(numValue)) return "--"
    const rounded = Math.round(numValue)
    const parts = rounded.toString().split(".")
    const intPart = parts[0]
    let lastThree = intPart.substring(intPart.length - 3)
    const otherNumbers = intPart.substring(0, intPart.length - 3)
    if (otherNumbers !== "") lastThree = "," + lastThree
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree
    return `₹${formatted} Cr`
  }

  const getFundHouseLogoUrl = () => {
    return `${AMC_LOGO_BASE_URL}/${fund.fund_house}.png`
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-4 md:py-8">
          <div className="max-w-6xl w-full px-4 md:px-8 lg:px-16 xl:px-24 space-y-6 md:space-y-8">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              {/* Mobile Fund Header */}
              <div className="py-6">
                <div className="flex items-start space-x-4 mb-4">
                  {/* Fund House Logo */}
                  <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    <Image
                      src={getFundHouseLogoUrl() || "/placeholder.svg"}
                      alt={`${fund.fund_house_name} Logo`}
                      fill
                      quality={100}
                      className="object-cover rounded-sm"
                      sizes="(max-width: 768px) 48px, 64px"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class='w-full h-full bg-slate-200 rounded-sm animate-pulse flex items-center justify-center'></div>
                        `
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 leading-tight mb-1">{fund.scheme_name}</h1>
                    <p className="text-slate-500 text-sm">
                      {fund.fund_type} • {fund.fund_category}
                    </p>
                  </div>
                </div>

                {/* Mobile NAV and Score Section */}
                <div className="flex flex-row gap-3 mb-4 md:hidden">
                  <div className="flex-1 rounded-lg flex flex-col items-center justify-center px-4 py-3 min-w-[140px] bg-slate-100">
                    <div className="text-sm text-slate-500">Current NAV</div>
                    <div className="text-2xl font-bold text-slate-900">₹{formatValue(fund.current_nav, 2)}</div>
                    <div className="text-xs text-slate-500">NAV Date: {formatDbTimestamp(fund.current_nav_date, true)}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{formatValue(fund.total_score, 1)}</div>
                    <div className="text-xs font-semibold text-blue-700">MF Compass Score</div>
                    <div className="text-[10px] text-blue-500 mt-1">{fund.score_updated ? `Updated: ${formatDbTimestamp(fund.score_updated, true)}` : ""}</div>
                  </div>
                </div>
              </div>

              {/* Mobile Returns Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Returns Performance</h3>
                <p className="text-sm text-slate-500 mb-4">As of {formatDbTimestamp(fund.returns_date, true)}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: fund.returns_1d, label: "1D" },
                    { value: fund.returns_1w, label: "1W" },
                    { value: fund.returns_1y, label: "1Y" },
                    { value: fund.returns_3y, label: "3Y" },
                    { value: fund.returns_5y, label: "5Y" },
                    { value: fund.returns_inception, label: "Since Inception" },
                  ].map((item, index) => (
                    <div key={index} className="bg-slate-100 rounded-lg p-3 text-center">
                      <div className={`font-bold text-lg ${getReturnColor(item.value)}`}>
                        {formatReturn(item.value)}
                      </div>
                      <div className="text-slate-700 font-medium text-xs mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fund Details Card (Mobile Only) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Fund Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 text-sm">Fund House</span>
                    <span className="text-slate-900 font-medium text-sm">{fund.fund_house_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 text-sm">AUM</span>
                    <span className="text-slate-900 font-medium text-sm">{formatAUM(fund.aum)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 text-sm">ISIN</span>
                    <span className="text-slate-900 font-medium text-sm">{fund.isin || "--"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 text-sm">Launch Date</span>
                    <span className="text-slate-900 font-medium text-sm">{formatDbTimestamp(fund.start_date, true)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 text-sm">Fund Rating</span>
                    <span className="text-slate-900 font-medium text-sm flex items-center gap-1">
                      {fund.fund_rating ? fund.fund_rating : "--"}
                      {fund.fund_rating && (
                        <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 text-sm">Fund Managers</span>
                    <span className="flex flex-col items-end gap-1 text-right">
                      {(() => {
                        let managers: string[] = []
                        if (fund.fund_managers) {
                          try {
                            if (typeof fund.fund_managers === "string") {
                              const parsed = JSON.parse(fund.fund_managers)
                              if (Array.isArray(parsed))
                                managers = parsed.map((m: string | { name: string }) =>
                                  typeof m === "string" ? m : m.name,
                                )
                            } else if (Array.isArray(fund.fund_managers)) {
                              managers = fund.fund_managers.map((m: string | { name: string }) =>
                                typeof m === "string" ? m : m.name,
                              )
                            }
                          } catch {
                            managers = [fund.fund_managers.toString()]
                          }
                        }
                        if (managers.length === 0) return <span className="text-slate-400">Not Available</span>
                        return managers.map((name, idx) => (
                          <span key={idx} className="text-slate-900 text-sm font-medium block text-right">
                            {name}
                          </span>
                        ))
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Investment Options */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Investment Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-sm font-medium text-slate-600 mb-1">Min. Lumpsum</div>
                    <div className="text-slate-900 font-semibold text-sm">
                      {fund.lump_available === "Y" && fund.lump_min ? formatCurrency(fund.lump_min) : "N/A"}
                    </div>
                  </div>
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-sm font-medium text-slate-600 mb-1">Min. SIP</div>
                    <div className="text-slate-900 font-semibold text-sm">
                      {fund.sip_available === "Y" && fund.sip_min ? formatCurrency(fund.sip_min) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-900 mb-1">{fund.crisil_rating || "--"}</div>
                    <div className="text-xs font-medium text-slate-600">CRISIL Rating</div>
                  </div>
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-900 mb-1">{formatValue(fund.volatility, 2, "%")}</div>
                    <div className="text-xs font-medium text-slate-600">Volatility</div>
                  </div>
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-900 mb-1">{formatValue(fund.portfolio_turnover, 2, "%")}</div>
                    <div className="text-xs font-medium text-slate-600">Portfolio Turnover</div>
                  </div>
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-900 mb-1">{formatValue(fund.expense_ratio, 2, "%")}</div>
                    <div className="text-xs font-medium text-slate-600">Expense Ratio</div>
                  </div>
                  <div className="text-center bg-slate-100 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-900 mb-1">{fund.lock_in_period ? `${fund.lock_in_period}` : "0"}</div>
                    <div className="text-xs font-medium text-slate-600">Lock-in (Years)</div>
                  </div>
                </div>
              </div>

              {/* Mobile Investment Objective */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Investment Objective</h3>
                <div className="text-slate-700 leading-relaxed text-sm">
                  {fund.investment_objective || "Investment objective not available."}
                </div>
              </div>

              {/* Data Information Card (Mobile) */}
              <div className="bg-slate-100 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Kuvera Code:</span>
                    <span className="text-slate-900 font-medium">{fund.kuvera_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Last Updated:</span>
                    <span className="text-slate-900 font-medium">{formatDbTimestamp(fund.last_updated)}</span>
                  </div>
                </div>
              </div>

              {/* Remove More Information Card (Mobile Only) */}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
              {/* Fund Header with Logo */}
              <div className="flex items-start justify-between py-8">
                <div className="flex items-start space-x-6 flex-1">
                  {/* Fund House Logo */}
                  <div className="w-16 h-16 bg-white rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    <Image
                      src={getFundHouseLogoUrl() || "/placeholder.svg"}
                      alt={`${fund.fund_house_name} Logo`}
                      fill
                      quality={100}
                      className="object-cover rounded-sm"
                      sizes="(max-width: 1024px) 64px, 96px"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class='w-full h-full bg-slate-200 rounded-sm animate-pulse flex items-center justify-center'></div>
                        `
                      }}
                    />
                  </div>

                  {/* Title and Subtitle */}
                  <div className="space-y-2 flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">{fund.scheme_name}</h1>
                    <p className="text-slate-500 text-lg">
                      {fund.fund_type} • {fund.fund_category}
                    </p>
                  </div>
                </div>

                {/* NAV and Score Section (Desktop: stacked as before) */}
                <div className="hidden md:flex gap-6 mb-4">
                  <div className="rounded-lg flex flex-col items-end justify-center px-4 py-3 min-w-[160px] bg-slate-100">
                    <div className="text-sm text-slate-500">Current NAV</div>
                    <div className="text-3xl font-bold text-slate-900">₹{formatValue(fund.current_nav, 2)}</div>
                    <div className="text-xs text-slate-500">
                      NAV Date: {formatDbTimestamp(fund.current_nav_date, true)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fund Details and Metrics Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Fund Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Fund Details</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                      <span className="text-slate-600 font-medium">Fund House</span>
                      <span className="text-slate-900 font-semibold">{fund.fund_house_name}</span>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                      <span className="text-slate-600 font-medium">ISIN</span>
                      <span className="text-slate-900 font-semibold">{fund.isin || "--"}</span>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                      <span className="text-slate-600 font-medium">Launch Date</span>
                      <span className="text-slate-900 font-semibold">{formatDbTimestamp(fund.start_date, true)}</span>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                      <span className="text-slate-600 font-medium">AUM</span>
                      <span className="text-slate-900 font-semibold">{formatAUM(fund.aum)}</span>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                      <span className="text-slate-600 font-medium">Fund Managers</span>
                      <span className="text-slate-900 font-semibold">
                        {(() => {
                          let managers: string[] = []
                          if (fund.fund_managers) {
                            try {
                              if (typeof fund.fund_managers === "string") {
                                const parsed = JSON.parse(fund.fund_managers)
                                if (Array.isArray(parsed))
                                  managers = parsed.map((m: string | { name: string }) =>
                                    typeof m === "string" ? m : m.name,
                                  )
                              } else if (Array.isArray(fund.fund_managers)) {
                                managers = fund.fund_managers.map((m: string | { name: string }) =>
                                  typeof m === "string" ? m : m.name,
                                )
                              }
                            } catch {
                              managers = [fund.fund_managers.toString()]
                            }
                          }
                          if (managers.length === 0) return <span className="text-slate-400">Not Available</span>
                          return managers.map((name, idx) => (
                            <span key={idx} className="text-slate-900 text-sm font-medium block text-right">
                              {name}
                            </span>
                          ))
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Key Metrics</h3>
                  {/* MF Compass Score - Main Focus */}
                  <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-2 border border-blue-100">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{formatValue(fund.total_score, 1)}</div>
                    <div className="text-sm font-semibold text-blue-700">MF Compass Score</div>
                    <div className="text-xs text-blue-500 mt-1">
                      {fund.score_updated ? `Updated: ${formatDbTimestamp(fund.score_updated, true)}` : ""}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                      <span className="text-slate-600 font-medium">Fund Rating</span>
                      <span className="flex items-center space-x-2">
                        <span className="text-slate-900 font-semibold">
                          {fund.fund_rating ? fund.fund_rating : "--"}
                        </span>
                        {fund.fund_rating && (
                          <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                      </span>
                    </div>
                    <div className="bg-slate-100 rounded-lg px-4 py-3">
                      <span className="text-slate-600 font-medium block mb-2">Investment Options</span>
                      <div className="px-0">
                        <table className="w-full text-sm rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          <tbody>
                            <tr>
                              <td className="px-3 py-2 font-medium text-slate-600 w-1/2 border-b border-slate-200">
                                Min. Lumpsum
                              </td>
                              <td className="px-3 py-2 text-slate-900 font-semibold w-1/2 border-b border-slate-200 text-right">
                                {fund.lump_available === "Y" && fund.lump_min ? (
                                  formatCurrency(fund.lump_min)
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 font-medium text-slate-600 w-1/2">Min. SIP</td>
                              <td className="px-3 py-2 text-slate-900 font-semibold w-1/2 text-right">
                                {fund.sip_available === "Y" && fund.sip_min ? (
                                  formatCurrency(fund.sip_min)
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Returns Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="px-6 pt-4 pb-2 bg-white" style={{ marginBottom: "-10px" }}>
                  <h3 className="text-xl font-semibold text-slate-900">Returns Performance</h3>
                  <p className="text-sm text-slate-500">As of {formatDbTimestamp(fund.returns_date, true)}</p>
                </div>
                <div className="overflow-x-auto px-2 md:px-4">
                  <table className="w-full border-separate border-spacing-y-2 border-spacing-x-0">
                    <tbody>
                      <tr>
                        {[
                          { value: fund.returns_1d, label: "1D" },
                          { value: fund.returns_1w, label: "1W" },
                          { value: fund.returns_1y, label: "1Y" },
                          { value: fund.returns_3y, label: "3Y" },
                          { value: fund.returns_5y, label: "5Y" },
                          { value: fund.returns_inception, label: "Since Inception" },
                        ].map((item, index) => (
                          <td key={index} className="px-2 py-2 align-top">
                            <div
                              className={`bg-slate-100 rounded-lg flex flex-col items-center justify-center py-2 px-2`}
                            >
                              <span className={`font-bold text-xl ${getReturnColor(item.value)}`}>
                                {formatReturn(item.value)}
                              </span>
                              <span className="text-slate-700 font-medium text-xs mt-1">{item.label}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Risk Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                    <div className="text-2xl font-bold text-slate-900 mb-1 text-center">
                      {fund.crisil_rating || "--"}
                    </div>
                    <div className="text-sm font-medium text-slate-600">CRISIL Rating</div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                    <div className="text-2xl font-bold text-slate-900 mb-1">{formatValue(fund.volatility, 2, "%")}</div>
                    <div className="text-sm font-medium text-slate-600">Volatility</div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {formatValue(
                        fund.portfolio_turnover !== null && fund.portfolio_turnover !== undefined
                          ? typeof fund.portfolio_turnover === "string"
                            ? Number.parseFloat(fund.portfolio_turnover) * 100
                            : fund.portfolio_turnover * 100
                          : fund.portfolio_turnover,
                        2,
                        "%",
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Portfolio Turnover</div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {formatValue(fund.expense_ratio, 2, "%")}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Expense Ratio</div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {fund.lock_in_period ? `${fund.lock_in_period}` : "0"}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Lock-in (Years)</div>
                  </div>
                </div>
              </div>

              {/* Investment Objective */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Investment Objective</h3>
                <div className="text-slate-700 leading-relaxed">
                  {fund.investment_objective || "Investment objective not available."}
                </div>
              </div>

              {/* Data Information */}
              <div className="bg-slate-100 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Kuvera Code:</span>
                    <span className="text-slate-900 font-medium">{fund.kuvera_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Last Updated:</span>
                    <span className="text-slate-900 font-medium">{formatDbTimestamp(fund.last_updated)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center py-4 md:py-6 border-t border-slate-200">
              <div className="text-xs md:text-sm text-slate-500 max-w-4xl mx-auto px-4">
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
