"use client"

import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

import { cn } from "@/lib/utils"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function RichTextEditor({ value, onChange, onBlur, placeholder, disabled, className }: RichTextEditorProps) {
  return <ReactQuill value={value} onChange={onChange} onBlur={onBlur} readOnly={disabled} theme="snow" placeholder={placeholder} className={cn("min-w-0 max-w-full overflow-hidden [&_.ql-container]:min-h-64 [&_.ql-container]:max-w-full [&_.ql-editor]:min-h-64 [&_.ql-editor]:max-w-full [&_.ql-editor]:break-words [&_.ql-editor]:text-sm [&_.ql-editor]:leading-7 [&_.ql-editor]:[overflow-wrap:anywhere] [&_.ql-toolbar]:flex [&_.ql-toolbar]:max-w-full [&_.ql-toolbar]:flex-wrap", className)} />
}
