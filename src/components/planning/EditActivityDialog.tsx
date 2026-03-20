'use client'

import { useState, useEffect } from 'react'
import type { Activity } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Loader2 } from 'lucide-react'
import { PRESET_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'

// ── Constants ──────────────────────────────────────────────────────────────

export const TEAM_COLORS: Record<string, string> = {
  'Feature':        '#22c55e',
  'Melhoria':       '#3b82f6',
  'Bug':            '#ef4444',
  'Débito Técnico': '#f97316',
  'Pesquisa':       '#a855f7',
  'Integração':     '#06b6d4',
}

const TEAMS = Object.keys(TEAM_COLORS)

export const AREA_COLORS: Record<string, string> = {
  'Core Platform': '#6366f1',
  'Agentes':       '#a855f7',
  'Marketplace':   '#06b6d4',
  'Analytics':     '#3b82f6',
  'Integrações':   '#eab308',
  'Backoffice':    '#64748b',
}

const AREAS = Object.keys(AREA_COLORS)

const STATUSES = [
  { key: 'Backlog',       color: '#8b8fa3' },
  { key: 'Planejado',     color: '#06b6d4' },
  { key: 'Em Andamento',  color: '#818cf8' },
  { key: 'Em Review',     color: '#eab308' },
  { key: 'Em Produção',   color: '#16a34a' },
  { key: 'Concluído',     color: '#4ade80' },
]

const SIZES = [
  { key: 'S',  sprints: 1, color: '#22c55e' },
  { key: 'M',  sprints: 2, color: '#eab308' },
  { key: 'L',  sprints: 3, color: '#f97316' },
  { key: 'XL', sprints: 0, color: '#ef4444' },
]

const QUARTERS = [
  { key: 'Q1', label: 'Q1 — Jan–Mar', color: '#06b6d4' },
  { key: 'Q2', label: 'Q2 — Abr–Jun', color: '#6366f1' },
  { key: 'Q3', label: 'Q3 — Jul–Set', color: '#22c55e' },
  { key: 'Q4', label: 'Q4 — Out–Dez', color: '#f97316' },
  { key: 'wishlist', label: 'Lista de Desejos', color: '#ec4899' },
]

// ── Types ──────────────────────────────────────────────────────────────────

export interface EditActivityValues {
  name: string
  description: string
  jiraRef: string
  quarter: string
  area: string
  planStatus: string
  team: string
  sizeLabel: string
  durationSprints: number
  origin: string
  clients: string[]
  color: string
  tags: { name: string; color: string }[]
  planningNote: string
}

interface EditActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity
  onSubmit: (values: EditActivityValues) => Promise<void>
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function EditActivityDialog({
  open,
  onOpenChange,
  activity,
  onSubmit,
}: EditActivityDialogProps) {
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jiraRef, setJiraRef] = useState('')
  const [quarter, setQuarter] = useState('')
  const [area, setArea] = useState('')
  const [planStatus, setPlanStatus] = useState('Backlog')
  const [team, setTeam] = useState('')
  const [sizeLabel, setSizeLabel] = useState('')
  const [durationSprints, setDurationSprints] = useState(1)
  const [origin, setOrigin] = useState('')
  const [clients, setClients] = useState<string[]>([])
  const [clientInput, setClientInput] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [tags, setTags] = useState<{ name: string; color: string }[]>([])
  const [tagInput, setTagInput] = useState('')
  const [planningNote, setPlanningNote] = useState('')
  const [colorOverridden, setColorOverridden] = useState(false)

  // Sync state when activity or dialog opens
  useEffect(() => {
    if (!open) return
    setName(activity.name)
    setDescription(activity.description ?? '')
    setJiraRef(activity.jiraRef ?? '')
    setQuarter(activity.quarter ?? '')
    setArea(activity.area ?? '')
    setPlanStatus(activity.planStatus ?? 'Backlog')
    setTeam(activity.team ?? '')
    setSizeLabel(activity.sizeLabel ?? '')
    setDurationSprints(activity.durationSprints)
    setOrigin(activity.origin ?? '')
    setClients(activity.clients ?? [])
    setColor(activity.color)
    setTags(activity.tags?.map((t) => ({ name: t.name, color: t.color })) ?? [])
    setPlanningNote(activity.planningNote ?? '')
    setColorOverridden(false)
    setClientInput('')
    setTagInput('')
  }, [open, activity])

  // Auto-set color from team (unless manually overridden)
  const handleTeamChange = (t: string) => {
    setTeam(t)
    if (!colorOverridden) {
      setColor(TEAM_COLORS[t] ?? '#6366f1')
    }
  }

  const handleColorChange = (c: string) => {
    setColor(c)
    setColorOverridden(true)
  }

  // Size preset
  const handleSizeClick = (key: string) => {
    setSizeLabel(key)
    const preset = SIZES.find((s) => s.key === key)
    if (preset?.sprints) setDurationSprints(preset.sprints)
  }

  // Clients
  const addClient = () => {
    const v = clientInput.trim()
    if (v && !clients.includes(v)) {
      setClients([...clients, v])
      setClientInput('')
    }
  }

  const removeClient = (c: string) => setClients(clients.filter((x) => x !== c))

  // Tags
  const addTag = () => {
    const v = tagInput.trim()
    if (v && !tags.find((t) => t.name === v)) {
      setTags([...tags, { name: v, color: DEFAULT_TAG_COLOR }])
      setTagInput('')
    }
  }

  const removeTag = (name: string) => setTags(tags.filter((t) => t.name !== name))

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        jiraRef: jiraRef.trim(),
        quarter,
        area,
        planStatus,
        team,
        sizeLabel,
        durationSprints,
        origin,
        clients,
        color,
        tags,
        planningNote: planningNote.trim(),
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: color }}
            />
            Editar Atividade
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-1">

          {/* ── Identidade ── */}
          <Section title="Identidade">
            <div className="space-y-1.5">
              <Label htmlFor="ea-name">Nome *</Label>
              <Input
                id="ea-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da atividade"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ea-desc">Descrição / Obs</Label>
              <Textarea
                id="ea-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto, detalhes técnicos..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ea-jira">Referência Jira</Label>
              <Input
                id="ea-jira"
                value={jiraRef}
                onChange={(e) => setJiraRef(e.target.value)}
                placeholder="ex: XCS-102"
                className="font-mono text-sm"
              />
            </div>
          </Section>

          {/* ── Planejamento ── */}
          <Section title="Planejamento">
            {/* Quarter */}
            <div className="space-y-1.5">
              <Label>Trimestre</Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuarter('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    quarter === ''
                      ? 'border-border bg-secondary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Nenhum
                </button>
                {QUARTERS.map((q) => (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => setQuarter(q.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      quarter === q.key
                        ? 'text-white border-transparent'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                    style={quarter === q.key ? { background: q.color, borderColor: q.color } : {}}
                  >
                    {q.key === 'wishlist' ? '⭐ Wishlist' : q.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Area */}
            <div className="space-y-1.5">
              <Label>Área de Produto</Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setArea('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    area === ''
                      ? 'border-border bg-secondary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Nenhuma
                </button>
                {AREAS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setArea(a)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      area === a ? 'border-transparent' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                    style={
                      area === a
                        ? { background: `${AREA_COLORS[a]}22`, color: AREA_COLORS[a], borderColor: `${AREA_COLORS[a]}44` }
                        : {}
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: AREA_COLORS[a] }} />
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setPlanStatus(s.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      planStatus === s.key ? 'border-transparent' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                    style={
                      planStatus === s.key
                        ? { background: `${s.color}22`, color: s.color, borderColor: `${s.color}44` }
                        : {}
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: s.color }}
                    />
                    {s.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <Label>Time</Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTeam('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    team === ''
                      ? 'border-border bg-secondary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Nenhum
                </button>
                {TEAMS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTeamChange(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      team === t ? 'border-transparent' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                    style={
                      team === t
                        ? { background: `${TEAM_COLORS[t]}22`, color: TEAM_COLORS[t], borderColor: `${TEAM_COLORS[t]}44` }
                        : {}
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: TEAM_COLORS[t] }}
                    />
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamanho + Sprints */}
            <div className="flex gap-4 items-end">
              <div className="space-y-1.5 flex-1">
                <Label>Tamanho</Label>
                <div className="flex gap-1.5">
                  {SIZES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleSizeClick(s.key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        sizeLabel === s.key ? 'border-transparent' : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                      style={
                        sizeLabel === s.key
                          ? { background: `${s.color}22`, color: s.color, borderColor: `${s.color}55` }
                          : {}
                      }
                    >
                      {s.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 w-28">
                <Label htmlFor="ea-sprints">Sprints</Label>
                <Input
                  id="ea-sprints"
                  type="number"
                  min={1}
                  max={52}
                  value={durationSprints}
                  onChange={(e) => setDurationSprints(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
          </Section>

          {/* ── Origem ── */}
          <Section title="Origem">
            <div className="space-y-3">
              {/* Toggle interno/cliente */}
              <div className="flex gap-0 rounded-lg overflow-hidden border border-border w-fit">
                {['', 'interno', 'cliente'].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrigin(o)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      origin === o
                        ? o === 'cliente'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : o === 'interno'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {o === '' ? 'N/A' : o === 'interno' ? 'Interno' : 'Cliente'}
                  </button>
                ))}
              </div>

              {/* Clients chips */}
              {origin === 'cliente' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {clients.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 text-xs font-semibold border border-yellow-500/20"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => removeClient(c)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={clientInput}
                      onChange={(e) => setClientInput(e.target.value)}
                      placeholder="Nome do cliente..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addClient() }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={addClient}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── Visual ── */}
          <Section title="Visual">
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorChange(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `3px solid ${c}` : undefined,
                      outlineOffset: color === c ? '2px' : undefined,
                    }}
                  />
                ))}
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-6 h-6 p-0 rounded-full cursor-pointer border-none flex-shrink-0"
                />
                {colorOverridden && team && TEAM_COLORS[team] && (
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
                    onClick={() => { setColor(TEAM_COLORS[team]); setColorOverridden(false) }}
                  >
                    restaurar cor do time
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Nova tag..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag() }
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="h-8" onClick={addTag}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.map((tag) => (
                    <Badge key={tag.name} variant="secondary" className="gap-1 text-xs">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.name)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* ── Nota ── */}
          <Section title="Nota de Planejamento">
            <Textarea
              value={planningNote}
              onChange={(e) => setPlanningNote(e.target.value)}
              placeholder="Contexto de planejamento, decisões, links..."
              rows={3}
            />
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
