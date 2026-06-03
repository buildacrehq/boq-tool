'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TopNav from './Sidebar'

export default function AppLayout({ children }) {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        localStorage.removeItem('boq_user')
        router.push('/login')
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </div>
  )
}
