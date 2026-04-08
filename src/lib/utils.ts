import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPatientName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string
): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || fallback
}
