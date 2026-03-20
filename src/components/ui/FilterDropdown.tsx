'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface FilterOption { key: string; label?: string; color?: string }

export function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: FilterOption[]
  selected: Set<string>
  onToggle: (key: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = options.filter((o) => selected.has(o.key)).length

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors whitespace-nowrap ${
          count > 0
            ? 'border-primary/50 text-primary bg-primary/5'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
            {count}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-44 bg-popover border border-border rounded-lg shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onToggle(opt.key)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left"
            >
              <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                selected.has(opt.key) ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {selected.has(opt.key) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </div>
              {opt.color && (
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
              )}
              <span className={selected.has(opt.key) ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                {opt.label ?? opt.key}
              </span>
            </button>
          ))}
          {count > 0 && (
            <div className="border-t border-border mt-1 pt-1 px-2">
              <button
                onClick={() => { onClear(); setOpen(false) }}
                className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground px-1 py-1 transition-colors"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
