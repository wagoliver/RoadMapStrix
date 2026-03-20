'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LayoutGrid, ArrowLeft, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SettingsView } from '@/components/settings/SettingsView'
import { api, type ProjectListItem } from '@/lib/api-client'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.projects.list()
      setProjects(data)
    } catch {
      toast.error('Falha ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      loadProjects()
    }
  }, [status, router, loadProjects])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      </div>
    )
  }

  const userName = session?.user?.name ?? session?.user?.email ?? 'U'
  const userInitial = userName[0].toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          {/* Back + logo */}
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                <LayoutGrid className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">RoadMapStrix</span>
            </div>
          </button>

          <div className="w-px h-4 bg-border mx-1" />
          <span className="text-sm font-medium text-foreground">Configurações</span>

          <div className="flex-1" />

          <ThemeToggle />

          <div className="w-px h-4 bg-border mx-1" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold">
              {userInitial}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.user?.name ?? session?.user?.email}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <SettingsView projects={projects} />
    </div>
  )
}
