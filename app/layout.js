import { Overpass } from 'next/font/google'
import './globals.css'

const overpass = Overpass({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-overpass',
})

export const metadata = {
  title: 'BOQ Tool — Buildacre',
  description: 'Site Construction Cost Calculator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={overpass.variable}>
      <body style={{ fontFamily: 'var(--font-overpass), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}