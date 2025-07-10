'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

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
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const params = useParams()
  const fundId = params.id as string
  const [fund, setFund] = useState<FundData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Environment variable for AMC logo base URL
  const AMC_LOGO_BASE_URL = process.env.NEXT_PUBLIC_AMC_LOGO_BASE_URL || 'https://ik.imagekit.io/cowboypanda/AMC'
  
  useEffect(() => {
    const fetchFundData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/funds/${fundId}`)
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch fund details')
        }
        
        if (result.success) {
          setFund(result.data)
        } else {
          throw new Error(result.error || 'Unknown error occurred')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    if (fundId) {
      fetchFundData()
    }
  }, [fundId])
  
  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <div className="layout-container flex h-full grow flex-col">
          
          <div className="flex flex-1 justify-center py-8">
            <div className="max-w-6xl w-full px-8 md:px-16 lg:px-24 space-y-12">
              {/* Fund Header Skeleton */}
              <div className="flex items-start justify-between py-8 animate-fadeIn">
                <div className="flex items-start space-x-6 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg animate-shimmer"></div>
                  <div className="space-y-4 flex-1">
                    <div className="h-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg animate-shimmer w-3/4"></div>
                    <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded animate-shimmer w-1/2" style={{ animationDelay: '0.1s' }}></div>
                  </div>
                </div>
                <div className="text-right space-y-3 ml-8">
                  <div className="h-12 w-32 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg animate-shimmer" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded animate-shimmer w-24" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>

              {/* Fund Details Grid Skeleton */}
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fadeIn" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                    <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded animate-shimmer w-1/3 mb-6"></div>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="flex justify-between py-2">
                          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded animate-shimmer w-1/3" style={{ animationDelay: `${0.6 + j * 0.05}s` }}></div>
                          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded animate-shimmer w-1/4" style={{ animationDelay: `${0.65 + j * 0.05}s` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
          
          .animate-fadeIn {
            opacity: 0;
            animation: fadeIn 0.6s ease-out forwards;
          }
        `}</style>
      </div>
    )
  }
  
  if (error || !fund) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Fund Not Found</h3>
              <p className="text-red-600">{error || 'The requested fund could not be found'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatValue = (value: number | string | null | undefined, decimals: number = 2, suffix: string = '') => {
    if (value === null || value === undefined) return '--'
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (isNaN(parsed)) return value
      return parsed.toFixed(decimals) + suffix
    }
    if (typeof value === 'number') return value.toFixed(decimals) + suffix
    return '--'
  }

  const formatReturn = (value: number | string | null) => {
    if (value === null) return '--'
    if (typeof value === 'number') return value.toFixed(2) + '%'
    return value
  }

  const getReturnColor = (value: number | string | null) => {
    if (value === null) return 'text-slate-600'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return 'text-slate-600'
    return numValue < 0 ? 'text-red-600' : 'text-green-600'
  }

  const formatCurrency = (value: number | string | null) => {
    if (value === null || value === undefined) return 'N/A'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return 'N/A'
    return `₹${numValue.toLocaleString()}`
  }

  // Format AUM with Indian-style commas, rounded to integer crores
  const formatAUM = (aum: number | string | null) => {
    if (aum === null || aum === undefined) return '--'
    const numValue = typeof aum === 'string' ? parseFloat(aum) : aum
    if (isNaN(numValue)) return '--'
    // Round to nearest integer
    const rounded = Math.round(numValue)
    // Custom Indian number system formatting
    const parts = rounded.toString().split('.')
    const intPart = parts[0]
    let lastThree = intPart.substring(intPart.length - 3)
    const otherNumbers = intPart.substring(0, intPart.length - 3)
    if (otherNumbers !== '') lastThree = ',' + lastThree
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree
    return `₹${formatted} Cr`
  }

  const getFundHouseLogoUrl = () => {
    return `${AMC_LOGO_BASE_URL}/${fund.fund_house}.png`
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        
        <div className="flex flex-1 justify-center py-8">
          <div className="max-w-6xl w-full px-8 md:px-16 lg:px-24 space-y-8">
            {/* Fund Header with Logo */}
            <div className="flex items-start justify-between py-8">
              <div className="flex items-start space-x-6 flex-1">
                {/* Fund House Logo */}
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Image 
                    src={getFundHouseLogoUrl()} 
                    alt={`${fund.fund_house_name} Logo`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class='w-full h-full bg-slate-100 rounded-lg flex items-center justify-center'>
                          <span class='text-slate-500 text-xs font-medium'>${fund.fund_house}</span>
                        </div>
                      `
                    }}
                  />
                </div>
                
                {/* Title and Subtitle */}
                <div className="space-y-2 flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 leading-tight">{fund.scheme_name}</h1>
                  <p className="text-slate-500 text-lg">{fund.fund_type} • {fund.fund_category}</p>
                </div>
              </div>
              
              {/* NAV Section */}
              <div className="rounded-lg flex flex-col items-end justify-center px-4 py-3 min-w-[160px]" style={{ backgroundColor: '#F1F5F9' }}>
                <div className="text-sm text-slate-500">Current NAV</div>
                <div className="text-3xl font-bold text-slate-900">
                  ₹{formatValue(fund.current_nav, 2)}
                </div>
                <div className="text-xs text-slate-500">
                  NAV Date: {fund.current_nav_date ? new Date(fund.current_nav_date).toLocaleDateString('en-IN') : '--'}
                </div>
              </div>
            </div>

            {/* Fund Details and Metrics Grid */}
            <div className="grid md:grid-cols-2 gap-8">
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
                    <span className="text-slate-900 font-semibold">{fund.isin || '--'}</span>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                    <span className="text-slate-600 font-medium">Launch Date</span>
                    <span className="text-slate-900 font-semibold">{new Date(fund.start_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                    <span className="text-slate-600 font-medium">AUM</span>
                    <span className="text-slate-900 font-semibold">{formatAUM(fund.aum)}</span>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                    <span className="text-slate-600 font-medium">Fund Managers</span>
                    <span className="flex flex-col items-end gap-1">
                      {(() => {
                        let managers: string[] = [];
                        if (fund.fund_managers) {
                          try {
                            if (typeof fund.fund_managers === 'string') {
                              const parsed = JSON.parse(fund.fund_managers);
                              if (Array.isArray(parsed)) managers = parsed.map(m => m.name || m);
                            } else if (Array.isArray(fund.fund_managers)) {
                              managers = fund.fund_managers.map(m => m.name || m);
                            }
                          } catch {
                            managers = [fund.fund_managers.toString()];
                          }
                        }
                        if (managers.length === 0) return <span className="text-slate-400">Not Available</span>;
                        return managers.map((name, idx) => (
                          <span key={idx} className="text-slate-900 text-sm font-medium">{name}</span>
                        ));
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Card (with grey boxes for all elements) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Key Metrics</h3>
                {/* MF Compass Score - Main Focus */}
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-2 border border-blue-100">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatValue(fund.total_score, 1)}
                  </div>
                  <div className="text-sm font-semibold text-blue-700">MF Compass Score</div>
                  <div className="text-xs text-blue-500 mt-1">
                    {fund.score_updated ? `Updated: ${new Date(fund.score_updated).toLocaleDateString('en-IN')}` : ''}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center w-full">
                    <span className="text-slate-600 font-medium">Fund Rating</span>
                    <span className="flex items-center space-x-2">
                      <span className="text-slate-900 font-semibold">
                        {fund.fund_rating ? fund.fund_rating : '--'}
                      </span>
                      {fund.fund_rating && (
                        <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
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
                            <td className="px-3 py-2 font-medium text-slate-600 w-1/2 border-b border-slate-200">Min. Lumpsum</td>
                            <td className="px-3 py-2 text-slate-900 font-semibold w-1/2 border-b border-slate-200 text-right">
                              {fund.lump_available === 'Y' && fund.lump_min ? formatCurrency(fund.lump_min) : <span className="text-slate-400">N/A</span>}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium text-slate-600 w-1/2">Min. SIP</td>
                            <td className="px-3 py-2 text-slate-900 font-semibold w-1/2 text-right">
                              {fund.sip_available === 'Y' && fund.sip_min ? formatCurrency(fund.sip_min) : <span className="text-slate-400">N/A</span>}
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 pt-4 pb-2 bg-white" style={{marginBottom: '-10px'}}>
                <h3 className="text-xl font-semibold text-slate-900">Returns Performance</h3>
                <p className="text-sm text-slate-500">
                  As of {fund.returns_date ? new Date(fund.returns_date).toLocaleDateString('en-IN') : '--'}
                </p>
              </div>
              <div className="overflow-x-auto px-2 md:px-4">
                <table className="w-full border-separate border-spacing-y-2 border-spacing-x-0">
                  <tbody>
                    <tr>
                      {[
                        { value: fund.returns_1d, label: '1D' },
                        { value: fund.returns_1w, label: '1W' },
                        { value: fund.returns_1y, label: '1Y' },
                        { value: fund.returns_3y, label: '3Y' },
                        { value: fund.returns_5y, label: '5Y' },
                        { value: fund.returns_inception, label: 'Since Inception' }
                      ].map((item, index) => (
                        <td key={index} className="px-2 py-2 align-top">
                          <div className={`bg-slate-100 rounded-lg flex flex-col items-center justify-center py-2 px-2`}>
                            <span className={`font-bold text-xl ${getReturnColor(item.value)}`}>{formatReturn(item.value)}</span>
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Risk Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                  <div className="text-2xl font-bold text-slate-900 mb-1 text-center">
                    {fund.crisil_rating || '--'}
                  </div>
                  <div className="text-sm font-medium text-slate-600">CRISIL Rating</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {formatValue(fund.volatility, 2, '%')}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Volatility</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {formatValue(
                      fund.portfolio_turnover !== null && fund.portfolio_turnover !== undefined
                        ? (typeof fund.portfolio_turnover === 'string'
                            ? parseFloat(fund.portfolio_turnover) * 100
                            : fund.portfolio_turnover * 100)
                        : fund.portfolio_turnover,
                      2,
                      '%'
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Portfolio Turnover</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {formatValue(fund.expense_ratio, 2, '%')}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Expense Ratio</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2 py-4 min-h-[90px] min-w-[110px]">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {fund.lock_in_period ? `${fund.lock_in_period}` : '0'} 
                  </div>
                  <div className="text-sm font-medium text-slate-600">Lock-in (Years)</div>
                </div>
              </div>
            </div>

            {/* Investment Objective */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Investment Objective</h3>
              <div className="text-slate-700 leading-relaxed">
                {fund.investment_objective || 'Investment objective not available.'}
              </div>
            </div>

            {/* Data Information */}
            <div className="bg-slate-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">Kuvera Code:</span>
                  <span className="text-slate-900 font-medium">{fund.kuvera_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Last Updated:</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(fund.last_updated).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center py-6 border-t border-slate-200">
              <div className="text-sm text-slate-500 max-w-4xl mx-auto">
                <strong>Disclaimer:</strong> Mutual funds are subject to market risks. Read all scheme related documents carefully before investing. 
                Past performance does not guarantee future returns. Investment decisions should be based on individual risk tolerance and financial objectives.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}