"use client"

interface PlaceholderTabProps {
  name: string
}

export function PlaceholderTab({ name }: PlaceholderTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 size-12 rounded-full bg-muted flex items-center justify-center">
        <span className="text-lg font-medium text-muted-foreground">{name[0]}</span>
      </div>
      <h3 className="text-sm font-medium text-foreground">{name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
    </div>
  )
}
