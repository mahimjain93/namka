'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const links = [
  { href: '/', label: 'Today' },
  { href: '/archive', label: 'Archive' },
  { href: '/flashcards', label: 'Flashcards' },
]

const profileLink = { href: '/profile', label: 'Profile' }

export default function Navbar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY < 10) {
        setVisible(true)
      } else if (currentY > lastScrollY.current) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Desktop — left sidebar, nav anchored to bottom */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-stone-200 fixed top-0 left-0 h-screen w-[200px]">
        <div className="px-4 pt-6 text-xs text-stone-400 uppercase tracking-widest">
          Na(m)ka
        </div>
        <nav className="px-3 pb-6 flex flex-col gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm px-3 py-2 rounded-md transition-colors ${
                pathname === href
                  ? 'bg-stone-100 text-stone-800 font-medium'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-stone-200 mt-2 pt-2">
            <Link
              href={profileLink.href}
              className={`text-sm px-3 py-2 rounded-md block transition-colors ${
                pathname === profileLink.href
                  ? 'bg-stone-100 text-stone-800 font-medium'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              {profileLink.label}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Mobile — bottom tab bar, hides on scroll down */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 transition-transform duration-200 ease-in-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="grid grid-cols-4">
          {[...links, profileLink].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-3 text-[11px] transition-colors ${
                pathname === href
                  ? 'text-stone-800 font-medium'
                  : 'text-stone-400'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}