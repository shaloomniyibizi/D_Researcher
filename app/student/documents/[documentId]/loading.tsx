export default function DocumentChatLoading() {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <div className="h-16 animate-pulse border-b bg-muted/40" />
      <div className="flex-1 space-y-5 p-8">
        <div className="ml-auto h-20 w-2/3 animate-pulse rounded-xl bg-muted" />
        <div className="h-32 w-3/4 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-24 animate-pulse border-t bg-muted/30" />
    </div>
  )
}
