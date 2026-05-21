'use client'
import TopNav from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </div>
  )
}
