'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface PopupOption {
  key: string
  label: string
  color?: string
}

interface PopupSelectorProps {
  anchorEl: HTMLElement
  title: string
  options: PopupOption[]
  activeKey?: string | null
  onSelect: (key: string) => void
  onClose: () => void
  extraContent?: React.ReactNode
}

export function PopupSelector({
  anchorEl,
  title,
  options,
  activeKey,
  onSelect,
  onClose,
  extraContent,
}: PopupSelectorProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const rect = anchorEl.getBoundingClientRect()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const left = Math.min(rect.left, window.innerWidth - 200)
  const top = rect.bottom + 4

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[500]"
        onClick={onClose}
      />
      <div
        ref={popupRef}
        className="fixed z-[501] bg-card border border-border rounded-xl py-1 shadow-2xl min-w-[160px] max-h-72 overflow-y-auto"
        style={{ left, top }}
      >
        {title && (
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </div>
        )}
        {options.map((opt) => (
          <button
            key={opt.key}
            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-accent/10 transition-colors ${
              activeKey === opt.key ? 'bg-primary/10 text-primary' : ''
            }`}
            onClick={() => { onSelect(opt.key); onClose() }}
          >
            {opt.color && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: opt.color }}
              />
            )}
            {opt.label}
          </button>
        ))}
        {extraContent}
      </div>
    </>,
    document.body
  )
}
