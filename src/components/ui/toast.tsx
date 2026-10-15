import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  onClose?: () => void
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  const variants = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 rounded-lg border p-4 shadow-lg",
        variants[type]
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
