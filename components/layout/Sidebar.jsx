'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: '▪' },
  { label: 'Projects', path: '/projects', icon: '▪' },
  { label: 'Prices', path: '/prices', icon: '▪' },
  { label: 'Settings', path: '/settings', icon: '▪' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  function handleLogout() {
    localStorage.removeItem('boq_user')
    router.push('/login')
  }

  function isActive(path) {
    if (path === '/projects') return pathname.startsWith('/projects')
    if (path === '/settings') return pathname.startsWith('/settings')
    if (path === '/prices') return pathname.startsWith('/prices')
    return pathname === path
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-56 bg-gray-900 flex flex-col z-20">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-widest">BUILDACRE</p>
            <p className="text-gray-400 text-xs">BOQ Tool</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
      <div className="px-4 py-4 border-t border-gray-700">
        {user && (
          <p className="text-gray-400 text-xs mb-3 truncate">
            {user.name} · {user.role}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-all"
        >
          Logout
        </button>
      </div>

    </div>
  )
}