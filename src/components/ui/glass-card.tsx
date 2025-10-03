import { cn } from "@/lib/utils"

type GlassVariant = 'default' | 'light' | 'luxury' | 'ultra-light'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: GlassVariant
  hover?: boolean
}

const glassVariants = {
  default: {
    base: "bg-white/80 backdrop-blur-md border-white/20 shadow-gray-200/20",
    hover: "hover:bg-white/90 hover:shadow-gray-200/30",
    gradient: "from-white/50 via-transparent to-gray-50/30"
  },
  light: {
    base: "bg-white/60 backdrop-blur-lg border-white/30 shadow-gray-100/10",
    hover: "hover:bg-white/70 hover:shadow-gray-200/20",
    gradient: "from-white/40 via-transparent to-gray-50/20"
  },
  luxury: {
    base: "bg-white/90 backdrop-blur-3xl border-white/40 shadow-xl shadow-gray-900/10",
    hover: "hover:bg-white/95 hover:shadow-2xl hover:shadow-gray-900/15 hover:border-white/50",
    gradient: "from-white/30 via-white/20 to-white/10"
  },
  'ultra-light': {
    base: "bg-white/30 backdrop-blur-2xl border-white/10 shadow-gray-100/5",
    hover: "hover:bg-white/40 hover:shadow-gray-200/10",
    gradient: "from-white/20 via-transparent to-transparent"
  }
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  ...props 
}: GlassCardProps) {
  const variantStyles = glassVariants[variant]
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "transition-all duration-300",
        variantStyles.base,
        hover && variantStyles.hover,
        hover && "hover:shadow-2xl",
        className
      )}
      {...props}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br pointer-events-none",
        variantStyles.gradient
      )} />
      
      {variant === 'luxury' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] animate-[shimmer_12s_ease-in-out_infinite]" />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}