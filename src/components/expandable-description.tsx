import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLLAPSE_THRESHOLD = 80

interface IExpandableDescriptionProps {
  text: string
  id: string
  expandedId: string | null
  onToggle: (id: string) => void
  className?: string
}

export const ExpandableDescription = ({
  text,
  id,
  expandedId,
  onToggle,
  className,
}: IExpandableDescriptionProps) => {
  const isExpanded = expandedId === id
  const isLong = text.length > COLLAPSE_THRESHOLD

  if (!isLong) {
    return <p className={cn('text-foreground [overflow-wrap:anywhere]', className)}>{text}</p>
  }

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? 'Zwiń opis' : 'Rozwiń opis'}
      className={cn(
        'w-full min-w-0 text-left rounded-md cursor-pointer group overflow-hidden',
        className
      )}
      onClick={() => onToggle(id)}
    >
      <p
        className={cn(
          'text-foreground [overflow-wrap:anywhere] transition-all duration-200',
          !isExpanded && 'line-clamp-2'
        )}
      >
        {text}
      </p>
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </span>
    </button>
  )
}
