"use client"

import { motion } from "framer-motion"
import { Listbox } from "@headlessui/react"
import { Fragment, useRef, useLayoutEffect, useState } from "react"

interface CategoryTabsProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: "Large Cap Fund", label: "Large Cap" },
  { id: "Mid Cap Fund", label: "Mid Cap" },
  { id: "Small Cap Fund", label: "Small Cap" },
  { id: "Flexi Cap Fund", label: "Flexi Cap" }
]

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const activeIndex = categories.findIndex((c) => c.id === activeCategory)
  const tabListRef = useRef<HTMLDivElement>(null)
  const [tabWidth, setTabWidth] = useState(0)

  useLayoutEffect(() => {
    if (tabListRef.current) {
      const tabList = tabListRef.current
      const tabCount = categories.length
      setTabWidth(tabList.offsetWidth / tabCount)
    }
  }, []);

  return (
    <div className="flex justify-center mb-6 md:mb-8 px-4">
      <div className="flex bg-slate-100 rounded-lg p-1 w-full max-w-3xl relative" ref={tabListRef}>
        {/* Sliding blue box indicator (desktop only) */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-md shadow-sm bg-[#0183ff] z-0 hidden md:block"
          style={{ width: tabWidth, left: 0 }}
          animate={{ x: tabWidth * activeIndex }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        />

        {/* Mobile: Modern Dropdown with Headless UI */}
        <div className="w-full md:hidden relative">
          <Listbox value={activeCategory} onChange={onCategoryChange}>
            <div className="relative">
              <Listbox.Button className="w-full px-4 py-2 rounded-lg font-medium text-base bg-white text-slate-800 border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0183ff] transition-all flex items-center justify-between">
                <span>{categories.find(c => c.id === activeCategory)?.label || "Select"}</span>
                <span className="ml-2 text-slate-400">
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute mt-2 w-full bg-white rounded-lg shadow-sm ring-1 ring-black/5 z-10 focus:outline-none list-none px-2 py-2 border border-slate-200">
                {categories.map((category) => (
                  <Listbox.Option
                    key={category.id}
                    value={category.id}
                    as={Fragment}
                  >
                    {({ active, selected }) => (
                      <li
                        className={`cursor-pointer select-none px-4 py-2 rounded-xl text-base ${
                          active ? "bg-[#0183ff]/10 text-[#0183ff]" : "text-slate-800"
                        } ${selected ? "font-semibold bg-[#0183ff]/20" : "font-normal"}`}
                      >
                        {category.label}
                      </li>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Desktop: Full width tabs */}
        <div className="hidden md:flex w-full relative overflow-hidden">
          {categories.map((category) => {
            const isActive = activeCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`relative flex-1 px-4 lg:px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 z-10 whitespace-nowrap text-center ${
                  isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
                style={{ overflow: "hidden", minWidth: 0 }}
              >
                <span className="relative z-10 block whitespace-nowrap">{category.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
