import Image from 'next/image'
import Link from 'next/link'

interface HeaderProps {
  showNavigation?: boolean
}

export default function Header({ showNavigation = false }: HeaderProps) {
  return (
    <div className="sticky top-0 z-50 w-full">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e6edf4] px-10 py-4 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 w-full">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-[#0c151d]">
            <div className="size-7">
              <Image
                src="/logo.svg"
                alt="MF Compass Logo"
                width={32}
                height={32}
                className="w-7 h-7"
              />
            </div>
            <Link href="/">
              <h2 className="text-[#0c151d] text-lg font-bold leading-tight tracking-[-0.015em] hover:text-[#359dff] transition-colors">
                MF Compass
              </h2>
            </Link>
          </div>
          
          {showNavigation && (
            <div className="flex items-center gap-9">
              <Link href="/" className="text-[#0c151d] text-sm font-medium leading-normal hover:text-[#359dff] transition-colors">
                Home
              </Link>
              <Link href="/funds" className="text-[#0c151d] text-sm font-medium leading-normal hover:text-[#359dff] transition-colors">
                Funds
              </Link>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}