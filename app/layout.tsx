import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pomodoro Task Manager',
  description: 'Minimalist productivity application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
