'use client'

import { useState, useEffect } from 'react'
import CategoryTabs from '../components/CategoryTabs'
import FundsTable from '../components/FundsTable'

interface Fund {
	id: number
	kuvera_code: string
	scheme_name: string
	fund_house: string // <-- add this line
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

	const [activeCategory, setActiveCategory] = useState('Large Cap Fund')
	const [funds, setFunds] = useState<Fund[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchFunds = async (category: string) => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(
				`/api/funds?category=${encodeURIComponent(category)}`
			)
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to fetch funds')
			}

			if (result.success) {
				setFunds(result.data)
			} else {
				throw new Error(result.error || 'Unknown error occurred')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
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
				<div className="flex flex-1 justify-center py-12">
					<div className="max-w-7xl w-full px-8 md:px-16 lg:px-24">
						{/* Page Header */}
						<div className="text-center space-y-6 mb-12">
							<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
								Fund <span className="text-[#0183ff]">Rankings</span>
							</h1>
							<p className="text-xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto">
							Compare mutual funds across categories using transparent, data-driven scores. All funds are filtered for quality, consistency, and performance
							</p>
						</div>

						{/* Category Tabs */}
						<CategoryTabs
							activeCategory={activeCategory}
							onCategoryChange={handleCategoryChange}
						/>

						{/* Content Area */}
						<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
							{loading ? (
								// Loading skeleton matching FundsTable layout
								<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
									{/* Header Skeleton */}
									<div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
										<div className="flex items-center justify-between">
											<div>
												<div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
											</div>
											<div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>
										</div>
									</div>
									{/* Table Skeleton */}
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead>
												<tr className="border-b border-slate-200 bg-slate-50">
													<th className="px-6 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div></th>
													<th className="px-4 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div></th>
													<th className="px-2 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div></th>
													<th className="px-2 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div></th>
													<th className="px-2 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div></th>
													<th className="px-2 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div></th>
													<th className="px-2 py-4 text-left"><div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div></th>
												</tr>
											</thead>
											<tbody>
												{[...Array(8)].map((_, i) => (
													<tr key={i} className="border-b border-slate-100">
														{/* Fund Name + Logo (single line) */}
														<td className="px-6 py-5">
															<div className="flex items-center">
																<div className="w-8 h-8 bg-slate-200 rounded-lg mr-2 animate-pulse"></div>
																<div className="h-4 bg-slate-200 rounded w-40 animate-pulse"></div>
															</div>
														</td>
														{/* Score */}
														<td className="px-4 py-5">
															<div className="h-6 bg-slate-200 rounded w-10 mx-auto animate-pulse"></div>
														</td>
														{/* Returns columns */}
														{[...Array(5)].map((_, j) => (
															<td key={j} className="px-2 py-5">
																<div className="h-4 bg-slate-200 rounded w-12 mx-auto animate-pulse"></div>
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							) : error ? (
								<div className="flex flex-col justify-center items-center h-64 space-y-4">
									<div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
										<svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
									</div>
									<div className="text-center">
										<h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Funds</h3>
										<p className="text-red-600">{error}</p>
									</div>
								</div>
							) : (
								<>
									{/* Results Header */}
									<div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
										<div className="flex items-center justify-between">
											<div>
												<h2 className="text-lg font-semibold text-slate-900">
													{(() => {
														let cat = activeCategory;
														if (cat.toLowerCase().endsWith(' fund')) cat = cat.slice(0, -5);
														cat = cat.charAt(0).toUpperCase() + cat.slice(1);
														return cat;
													})()} Funds
												</h2>
											</div>
											<div className="text-sm text-slate-500 font-medium">
												{funds.length} fund{funds.length === 1 ? '' : 's'} ranked
											</div>
										</div>
									</div>
									
									{/* Funds Table */}
									<FundsTable funds={funds} />
								</>
							)}
						</div>

						{/* Disclaimer */}
						<div className="text-center py-6 border-t border-slate-200 mt-12">
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