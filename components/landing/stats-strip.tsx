import React from 'react'

export function StatStrip() {
  return (
    <div className="stats-strip mx-auto max-w-6xl relative z-30 min-w-[1080px, calc(100% - 40px)] -mt-14 mx-auto mb-0 grid md:grid-cols-4 gap-0.5 overflow-hidden border rounded bg-border shadow " aria-label="Platform highlights">
        <div className="stat bg-background p-6">
          <strong className='block text-2xl font-black'>360°</strong>
          <span className='block mt-1.5 text-muted-foreground text-sm leading-none'>Research lifecycle coverage</span>
        </div>
        <div className="stat bg-background p-6">
          <strong className='block text-2xl font-black'>3</strong>
          <span className='block mt-1.5 text-muted-foreground text-sm leading-none'>Core portals for students, supervisors, and admins</span>
        </div>
        <div className="stat bg-background p-6">
          <strong className='block text-2xl font-black'>AI</strong>
          <span className='block mt-1.5 text-muted-foreground text-sm leading-none'>RAG paper chat, proposals, literature review, and feedback</span>
        </div>
        <div className="stat bg-background p-6">
          <strong className='block text-2xl font-black'>RBAC</strong>
          <span className='block mt-1.5 text-muted-foreground text-sm leading-none'>Role-based security, audit logs, and protected routes</span>
        </div>
      </div>
  )
}
