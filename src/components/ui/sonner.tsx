"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "font-sans text-sm",
          title: "text-sm font-semibold",
          description: "text-xs text-muted-foreground",
          actionButton: "!h-7 !px-2.5 !text-xs",
          cancelButton: "!h-7 !px-2.5 !text-xs",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
