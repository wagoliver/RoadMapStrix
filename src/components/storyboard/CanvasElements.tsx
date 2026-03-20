'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Image as ImageFit, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CanvasElement } from './canvasTypes'

// ─── Constants ────────────────────────────────────────────────────────────────

export const MIN_EL_W = 80
export const MIN_EL_H = 40

const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '40', '48']
const DEFAULT_FONT_SIZE = '14'

const TEXT_COLORS = [
  '#ffffff', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#111827',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
]

const HIGHLIGHT_COLORS = [
  'transparent',
  '#fef08a', '#bbf7d0', '#bfdbfe', '#f5d0fe',
  '#fecaca', '#fed7aa', '#e0f2fe', '#d1fae5',
]

// ─── FontSize extension ───────────────────────────────────────────────────────

const FontSizeExtension = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize?.replace('px', '') || null,
        renderHTML: (attrs) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}px` } : {},
      },
    }
  },
})

// ─── Color picker popover ─────────────────────────────────────────────────────

function ColorPopover({
  colors,
  currentColor,
  onPick,
  label,
  isHighlight,
}: {
  colors: string[]
  currentColor: string | null
  onPick: (color: string) => void
  label: string
  isHighlight?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayColor = currentColor && currentColor !== 'transparent' ? currentColor : null

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        className={cn(
          'flex items-center gap-1 h-5 px-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground',
          open && 'bg-accent text-foreground'
        )}
        title={label}
      >
        <span className="text-[10px] font-semibold">{isHighlight ? 'H' : 'A'}</span>
        <span
          className="w-3 h-1 rounded-sm border border-border/60"
          style={{
            background: displayColor
              ? displayColor
              : isHighlight
                ? 'repeating-linear-gradient(45deg,#888 0,#888 1px,transparent 0,transparent 4px)'
                : 'currentColor',
          }}
        />
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl p-2"
          data-no-drag
        >
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">{label}</p>
          <div className="grid grid-cols-8 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => { e.preventDefault(); onPick(c); setOpen(false) }}
                className={cn(
                  'w-4 h-4 rounded border border-border/40 hover:scale-125 transition-transform',
                  currentColor === c && 'ring-2 ring-primary ring-offset-1'
                )}
                style={{
                  background: c === 'transparent'
                    ? 'repeating-linear-gradient(45deg,#888 0,#888 2px,transparent 0,transparent 6px)'
                    : c,
                }}
                title={c === 'transparent' ? 'Remover' : c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Rich-text toolbar ────────────────────────────────────────────────────────

export function RichTextToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const currentFontSize =
    (editor.getAttributes('textStyle').fontSize as string | undefined) ?? DEFAULT_FONT_SIZE

  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) ?? null
  const currentHighlight = (editor.getAttributes('highlight').color as string | undefined) ?? null

  return (
    <div
      className="inline-flex items-center gap-0.5 px-1.5 py-1 bg-popover border border-border rounded-lg shadow-lg text-foreground select-none"
      data-no-drag
    >
      {/* Block type */}
      <select
        className="text-[10px] bg-transparent border-0 outline-none cursor-pointer text-muted-foreground hover:text-foreground h-5 pr-0.5"
        value={
          editor.isActive('heading', { level: 1 }) ? 'h1'
          : editor.isActive('heading', { level: 2 }) ? 'h2'
          : editor.isActive('heading', { level: 3 }) ? 'h3'
          : 'p'
        }
        onChange={(e) => {
          const v = e.target.value
          if (v === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().setHeading({ level: parseInt(v[1]) as 1|2|3 }).run()
        }}
      >
        <option value="p">Normal</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
      </select>

      {/* Font size */}
      <select
        className="text-[10px] bg-transparent border-0 outline-none cursor-pointer text-muted-foreground hover:text-foreground h-5 w-10 pr-0.5"
        value={currentFontSize}
        onChange={(e) => {
          editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()
        }}
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Format */}
      {([
        { icon: <Bold className="w-3 h-3" />,         action: () => editor.chain().focus().toggleBold().run(),      active: editor.isActive('bold'),      title: 'Bold' },
        { icon: <Italic className="w-3 h-3" />,       action: () => editor.chain().focus().toggleItalic().run(),    active: editor.isActive('italic'),    title: 'Italic' },
        { icon: <UnderlineIcon className="w-3 h-3" />,action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: 'Underline' },
        { icon: <Strikethrough className="w-3 h-3" />,action: () => editor.chain().focus().toggleStrike().run(),    active: editor.isActive('strike'),    title: 'Strike' },
      ] as const).map(({ icon, action, active, title }) => (
        <button
          key={title}
          onMouseDown={(e) => { e.preventDefault(); action() }}
          className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors', active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground')}
          title={title}
        >
          {icon}
        </button>
      ))}

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Align */}
      {([
        { icon: <AlignLeft className="w-3 h-3" />,   value: 'left' },
        { icon: <AlignCenter className="w-3 h-3" />, value: 'center' },
        { icon: <AlignRight className="w-3 h-3" />,  value: 'right' },
      ] as const).map(({ icon, value }) => (
        <button
          key={value}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign(value).run() }}
          className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors', editor.isActive({ textAlign: value }) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground')}
          title={`Align ${value}`}
        >
          {icon}
        </button>
      ))}

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Text color */}
      <ColorPopover
        colors={TEXT_COLORS}
        currentColor={currentColor}
        label="Cor do texto"
        onPick={(c) => editor.chain().focus().setColor(c).run()}
      />

      {/* Highlight */}
      <ColorPopover
        colors={HIGHLIGHT_COLORS}
        currentColor={currentHighlight}
        label="Marcação"
        isHighlight
        onPick={(c) => {
          if (c === 'transparent') editor.chain().focus().unsetHighlight().run()
          else editor.chain().focus().setHighlight({ color: c }).run()
        }}
      />
    </div>
  )
}

// ─── Text element ─────────────────────────────────────────────────────────────

export function TextElementComp({
  element,
  selected,
  onUpdate,
}: {
  element: CanvasElement
  selected: boolean
  onUpdate: (patch: Partial<CanvasElement>) => void
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      FontSizeExtension,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
    ],
    content: element.content ?? '<p>Texto</p>',
    editable: selected,
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onUpdate({ content: editor.getHTML() })
      }, 400)
    },
  })

  useEffect(() => {
    if (editor) editor.setEditable(selected)
  }, [editor, selected])

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {selected && editor && (
        <div className="flex-shrink-0 mb-1 z-10" data-no-drag>
          <RichTextToolbar editor={editor} />
        </div>
      )}
      <div
        className={cn(
          'flex-1 overflow-auto text-xs leading-relaxed outline-none',
          selected ? 'cursor-text' : 'cursor-default'
        )}
        data-no-drag={selected ? 'true' : undefined}
      >
        <EditorContent
          editor={editor}
          className="h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:h-full [&_.ProseMirror]:p-0 [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_p]:text-xs"
        />
      </div>
    </div>
  )
}

// ─── Image element ────────────────────────────────────────────────────────────

export function ImageElementComp({
  element,
  selected,
  onUpdate,
}: {
  element: CanvasElement
  selected: boolean
  onUpdate: (patch: Partial<CanvasElement>) => void
}) {
  const fit = element.objectFit ?? 'cover'

  return (
    <div className="w-full h-full relative overflow-hidden rounded-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={element.src}
        alt=""
        draggable={false}
        className="w-full h-full"
        style={{ objectFit: fit }}
      />
      {selected && (
        <button
          data-no-drag
          onClick={() => onUpdate({ objectFit: fit === 'cover' ? 'contain' : 'cover' })}
          className="absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] hover:bg-black/80 transition-colors"
          title="Alternar cover / contain"
        >
          <ImageFit className="w-2.5 h-2.5" />
          {fit}
        </button>
      )}
    </div>
  )
}

// ─── Element wrapper (drag + resize + selection) ──────────────────────────────

export function ElementWrapper({
  element,
  selected,
  locked,
  canvasRef,
  onSelect,
  onDeselect,
  onUpdate,
  onDelete,
  children,
}: {
  element: CanvasElement
  selected: boolean
  locked: boolean
  canvasRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onDeselect: () => void
  onUpdate: (patch: Partial<CanvasElement>) => void
  onDelete: () => void
  children: React.ReactNode
}) {
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const resizeDirs = ['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n'] as const
  type ResizeDir = typeof resizeDirs[number]
  const resizeRef = useRef<{ active: boolean; dir: ResizeDir; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }>({
    active: false, dir: 'se', startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0,
  })

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (locked) return
    if ((e.target as Element).closest('[data-no-drag]')) return
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: element.x, origY: element.y }

    const canvas = canvasRef.current
    const canvasRect = canvas?.getBoundingClientRect()

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active || !canvasRect) return
      const nx = Math.max(0, dragRef.current.origX + ev.clientX - dragRef.current.startX)
      const ny = Math.max(0, dragRef.current.origY + ev.clientY - dragRef.current.startY)
      onUpdate({ x: nx, y: ny })
    }
    const onUp = () => {
      dragRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [element.x, element.y, onSelect, onUpdate, canvasRef])

  const onResizeStart = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    if (locked) return
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { active: true, dir, startX: e.clientX, startY: e.clientY, origX: element.x, origY: element.y, origW: element.width, origH: element.height }

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current.active) return
      const dx = ev.clientX - resizeRef.current.startX
      const dy = ev.clientY - resizeRef.current.startY
      const d = resizeRef.current.dir

      let nx = resizeRef.current.origX
      let ny = resizeRef.current.origY
      let nw = resizeRef.current.origW
      let nh = resizeRef.current.origH

      if (d.includes('e')) nw = Math.max(MIN_EL_W, resizeRef.current.origW + dx)
      if (d.includes('s')) nh = Math.max(MIN_EL_H, resizeRef.current.origH + dy)
      if (d.includes('w')) {
        const dw = Math.min(dx, resizeRef.current.origW - MIN_EL_W)
        nw = resizeRef.current.origW - dw
        nx = resizeRef.current.origX + dw
      }
      if (d.includes('n')) {
        const dh = Math.min(dy, resizeRef.current.origH - MIN_EL_H)
        nh = resizeRef.current.origH - dh
        ny = resizeRef.current.origY + dh
      }

      onUpdate({ x: Math.max(0, nx), y: Math.max(0, ny), width: nw, height: nh })
    }
    const onUp = () => {
      resizeRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [element, onUpdate])

  const HANDLE_SIZE = 8
  const handles: { dir: ResizeDir; style: React.CSSProperties; cursor: string }[] = [
    { dir: 'nw', style: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 }, cursor: 'nw-resize' },
    { dir: 'ne', style: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 }, cursor: 'ne-resize' },
    { dir: 'sw', style: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 }, cursor: 'sw-resize' },
    { dir: 'se', style: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 }, cursor: 'se-resize' },
    { dir: 'n', style: { top: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize' },
    { dir: 's', style: { bottom: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize' },
    { dir: 'w', style: { top: '50%', left: -HANDLE_SIZE/2, transform: 'translateY(-50%)' }, cursor: 'w-resize' },
    { dir: 'e', style: { top: '50%', right: -HANDLE_SIZE/2, transform: 'translateY(-50%)' }, cursor: 'e-resize' },
  ]

  return (
    <div
      className={cn(
        'absolute group/el',
        selected
          ? 'ring-2 ring-primary ring-offset-0 z-20'
          : locked
            ? 'z-10'
            : 'hover:ring-1 hover:ring-primary/40 z-10'
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        cursor: locked ? 'default' : 'grab',
      }}
      onMouseDown={onDragStart}
      onClick={(e) => { e.stopPropagation(); if (!locked) onSelect() }}
    >
      {/* Content */}
      <div className="w-full h-full rounded-md overflow-visible">
        {children}
      </div>

      {/* Resize handles — hidden when locked */}
      {selected && !locked && handles.map(({ dir, style, cursor }) => (
        <div
          key={dir}
          data-no-drag
          className="absolute bg-white border-2 border-primary rounded-full z-30"
          style={{ ...style, cursor, width: HANDLE_SIZE, height: HANDLE_SIZE }}
          onMouseDown={(e) => onResizeStart(e, dir)}
        />
      ))}

      {/* Action buttons (top-right when selected) */}
      {selected && !locked && (
        <div className="absolute -top-7 right-0 flex items-center gap-1 z-30" data-no-drag>
          {/* Done / deselect */}
          <button
            onClick={(e) => { e.stopPropagation(); onDeselect() }}
            className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            title="Feito"
          >
            <Check className="w-2.5 h-2.5" />
          </button>
          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
            title="Remover elemento"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}
