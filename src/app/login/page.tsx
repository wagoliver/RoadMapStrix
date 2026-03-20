'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LayoutGrid, Loader2, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/projects')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10"
        style={{ background: 'var(--gradient-primary)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">RoadMapStrix</span>
        </div>

        <div className="text-white">
          <h2 className="text-3xl font-bold leading-tight mb-3">
            Plan smarter.<br />Ship faster.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Visualize your product roadmap with a Gantt-style interface. Drag, drop and deliver.
          </p>
        </div>

        <div className="text-white/40 text-xs">© 2026 RoadMapStrix</div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-end px-8 py-5 gap-3">
          <ThemeToggle />
          <Link
            href="/register"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Don&apos;t have an account? <span className="text-primary font-medium">Sign up</span>
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">RoadMapStrix</span>
            </div>

            <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-muted-foreground text-sm mb-8">Sign in to continue to your projects</p>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 gap-2 mt-2"
                disabled={loading}
                style={{ background: 'var(--gradient-primary)' }}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                }
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
