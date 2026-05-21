'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Projects',  path: '/projects'  },
  { label: 'Prices',    path: '/prices'    },
  { label: 'Settings',  path: '/settings'  },
]

export default function TopNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]   = useState(null)
  const [open, setOpen]   = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  function handleLogout() {
    localStorage.removeItem('boq_user')
    router.push('/login')
  }

  function isActive(path) {
    if (path === '/projects') return pathname.startsWith('/projects')
    if (path === '/settings') return pathname.startsWith('/settings')
    if (path === '/prices')   return pathname.startsWith('/prices')
    return pathname === path
  }

  return (
    <>
      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-gray-900 flex items-center justify-between px-4 z-30 border-b border-gray-700">
        {/* Logo */}
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm leading-none tracking-widest">BUILDACRE</p>
            <p className="text-gray-400 text-xs leading-tight">BOQ Tool</p>
          </div>
        </button>

        {/* Burger button */}
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <span className="w-5 h-0.5 bg-gray-300 rounded-full" />
          <span className="w-5 h-0.5 bg-gray-300 rounded-full" />
          <span className="w-5 h-0.5 bg-gray-300 rounded-full" />
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-64 bg-gray-900 z-50 flex flex-col shadow-2xl transition-transform duration-250 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <p className="text-white font-semibold text-sm">Menu</p>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-gray-700 space-y-3">
          {user && (
            <p className="text-gray-400 text-xs px-1 truncate">
              {user.name} · {user.role}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-all"
          >
            Logout
          </button>
        </div>

      </div>
    </>
  )
}
