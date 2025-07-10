'use client'

import { motion } from 'framer-motion'

interface CategoryTabsProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: 'Large Cap Fund', label: 'Large Cap' },
  { id: 'Mid Cap Fund', label: 'Mid Cap' },
  { id: 'Small Cap Fund', label: 'Small Cap' },
  { id: 'Flexi Cap Fund', label: 'Flexi Cap' },
  { id: 'ELSS', label: 'ELSS' },
  { id: 'hybrid', label: 'Hybrid' },
]

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const activeIndex = categories.findIndex(c => c.id === activeCategory)
  const tabCount = categories.length

  return (
    <div className="flex justify-center mb-8">
      <div className="flex bg-slate-100 rounded-lg p-1 relative overflow-hidden w-full max-w-3xl">
        {/* Sliding blue box indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-md shadow-sm bg-[#0183ff] z-0"
          style={{
            width: `${100 / tabCount}%`,
            left: 0,
          }}
          animate={{
            x: `${activeIndex * 100}%`
          }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
        />
        {categories.map((category) => {
          const isActive = activeCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`relative flex-1 px-4 md:px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 z-10 whitespace-nowrap text-center ${
                isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={{ overflow: 'hidden', minWidth: 0 }}
            >
              <span className="relative z-10 block whitespace-nowrap">{category.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}