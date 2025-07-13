"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

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

interface FundsTableProps {
  funds: Fund[]
}

export default function FundsTable({ funds }: FundsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Fund | null; direction: "desc" | "asc" | null }>({
    key: null,
    direction: null,
  })

  const sortedFunds = useMemo(() => {
    const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true })
    if (!sortConfig.key || !sortConfig.direction) {
      return [...funds].sort((a, b) => {
        const aScore = typeof a.total_score === "string" ? Number.parseFloat(a.total_score) : a.total_score
        const bScore = typeof b.total_score === "string" ? Number.parseFloat(b.total_score) : b.total_score
        return (bScore ?? 0) - (aScore ?? 0)
      })
    }
    if (sortConfig.key === "scheme_name") {
      return [...funds].sort((a, b) => {
        const aName = a.scheme_name || ""
        const bName = b.scheme_name || ""
        if (sortConfig.direction === "desc") {
          return collator.compare(bName, aName)
        } else {
          return collator.compare(aName, bName)
        }
      })
    }
    return [...funds].sort((a, b) => {
      const aVal = a[sortConfig.key!]
      const bVal = b[sortConfig.key!]
      const aNum = typeof aVal === "string" ? Number.parseFloat(aVal) : aVal
      const bNum = typeof bVal === "string" ? Number.parseFloat(bVal) : bVal
      if (sortConfig.direction === "desc") {
        return (bNum ?? 0) - (aNum ?? 0)
      } else {
        return (aNum ?? 0) - (bNum ?? 0)
      }
    })
  }, [funds, sortConfig])

  const handleSort = (key: keyof Fund) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "desc" }
      if (prev.direction === "desc") return { key, direction: "asc" }
      if (prev.direction === "asc") return { key: null, direction: null }
      return { key, direction: "desc" }
    })
  }

  const formatReturn = (value: number | string | null) => {
    if (value === null || value === undefined) return "--"
    const numericValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(numericValue) || numericValue === 0) return "--"
    return `${numericValue.toFixed(2)}%`
  }

  const getReturnColor = (value: number | string | null) => {
    if (value === null || value === undefined) return "text-slate-900"
    const numericValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(numericValue) || numericValue === 0) return "text-slate-900"
    return numericValue < 0 ? "text-red-600" : "text-green-600"
  }

  const formatScore = (score: number | string | null) => {
    if (score === null || score === undefined) return "N/A"
    const numericScore = typeof score === "string" ? Number.parseFloat(score) : score
    if (isNaN(numericScore)) return "N/A"
    return numericScore.toFixed(1)
  }

  const AMC_LOGO_BASE_URL = process.env.NEXT_PUBLIC_AMC_LOGO_BASE_URL || "https://ik.imagekit.io/cowboypanda/AMC"
  const getFundHouseLogoUrl = (fund: Fund) => {
    return `${AMC_LOGO_BASE_URL}/${fund.fund_house}.png`
  }

  if (sortedFunds.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No funds found</h3>
            <p className="text-slate-500">No funds available for this category</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block md:hidden">
        <AnimatePresence initial={false}>
          {sortedFunds.map((fund, index) => (
            <motion.div
              key={fund.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.7 }}
              className="border-b border-slate-100 last:border-b-0"
            >
              <Link href={`/fund/${fund.kuvera_code}`} className="block p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Image
                        src={getFundHouseLogoUrl(fund) || "/placeholder.svg"}
                        alt={`${fund.fund_house_name} Logo`}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class='w-full h-full bg-slate-100 rounded-lg flex items-center justify-center'>
                              <span class='text-slate-500 text-xs font-medium'>${fund.fund_house}</span>
                            </div>
                          `
                        }}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1 line-clamp-2">
                        {fund.scheme_name}
                      </h3>
                      {/* Fund house name removed for mobile */}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-[#0183ff] text-white">
                      {formatScore(fund.total_score)}
                    </span>
                    <span className="text-xs text-slate-500">#{index + 1}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className={`text-sm font-medium ${getReturnColor(fund.returns_1w)}`}>
                      {formatReturn(fund.returns_1w)}
                    </div>
                    <div className="text-xs text-slate-500">1W</div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${getReturnColor(fund.returns_1y)}`}>
                      {formatReturn(fund.returns_1y)}
                    </div>
                    <div className="text-xs text-slate-500">1Y</div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${getReturnColor(fund.returns_3y)}`}>
                      {formatReturn(fund.returns_3y)}
                    </div>
                    <div className="text-xs text-slate-500">3Y</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th
                className="px-6 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("scheme_name")}
              >
                Fund Name
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "scheme_name"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
              <th
                className="px-4 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("total_score")}
              >
                Score
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "total_score"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
              <th
                className="px-2 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("returns_1d")}
              >
                1D Return
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "returns_1d"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
              <th
                className="px-2 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("returns_1w")}
              >
                1W Return
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "returns_1w"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
              <th
                className="px-2 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("returns_1y")}
              >
                1Y Return
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "returns_1y"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
              <th
                className="px-2 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("returns_3y")}
              >
                3Y Return
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "returns_3y"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
              <th
                className="px-2 py-4 text-left text-slate-700 font-semibold text-sm tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors"
                onClick={() => handleSort("returns_5y")}
              >
                5Y Return
                <span style={{ display: "inline-block", width: 16, textAlign: "center" }}>
                  {sortConfig.key === "returns_5y"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : sortConfig.direction === "asc"
                        ? "↑"
                        : ""
                    : "\u00A0"}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 transition-all duration-500">
            <AnimatePresence initial={false}>
              {sortedFunds.map((fund) => (
                <motion.tr
                  key={fund.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.7 }}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <Link href={`/fund/${fund.kuvera_code}`} className="block hover:text-[#0183ff] transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden mr-2">
                          <Image
                            src={getFundHouseLogoUrl(fund) || "/placeholder.svg"}
                            alt={`${fund.fund_house_name} Logo`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class='w-full h-full bg-slate-100 rounded-lg flex items-center justify-center'>
                                  <span class='text-slate-500 text-xs font-medium'>${fund.fund_house}</span>
                                </div>
                              `
                            }}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="font-semibold text-slate-900">{fund.scheme_name}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-5">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#0183ff] text-white">
                      {formatScore(fund.total_score)}
                    </span>
                  </td>
                  <td className={`px-2 py-5 text-sm font-medium ${getReturnColor(fund.returns_1d)}`}>
                    {formatReturn(fund.returns_1d)}
                  </td>
                  <td className={`px-2 py-5 text-sm font-medium ${getReturnColor(fund.returns_1w)}`}>
                    {formatReturn(fund.returns_1w)}
                  </td>
                  <td className={`px-2 py-5 text-sm font-medium ${getReturnColor(fund.returns_1y)}`}>
                    {formatReturn(fund.returns_1y)}
                  </td>
                  <td className={`px-2 py-5 text-sm font-medium ${getReturnColor(fund.returns_3y)}`}>
                    {formatReturn(fund.returns_3y)}
                  </td>
                  <td className={`px-2 py-5 text-sm font-medium ${getReturnColor(fund.returns_5y)}`}>
                    {formatReturn(fund.returns_5y)}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </>
  )
}
