'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(stored))
  }, [])

  function handleLogout() {
    localStorage.removeItem('boq_user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome, {user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
        <p className="text-gray-500">BOQ Tool dashboard coming soon...</p>
      </div>
    </div>
  )
}