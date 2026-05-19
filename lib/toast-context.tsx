"use client"

import * as React from "react"
import { XIcon, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => {},
})

export function useToast() {
  return React.useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const iconMap: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const colorMap: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const Icon = iconMap[toast.variant]
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-sm animate-in slide-in-from-right-2 fade-in-0 duration-200 max-w-sm",
        colorMap[toast.variant]
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}
