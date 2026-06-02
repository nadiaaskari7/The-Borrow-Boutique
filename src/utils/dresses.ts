import type { BoutiqueSize, Dress } from '../types'

export const boutiqueSizes: BoutiqueSize[] = ['XS', 'S', 'M', 'L']

export function normalizeDressSize(size: unknown): BoutiqueSize {
  const value = String(size ?? '').trim().toLowerCase()

  if (['xs', 'x-small', 'extra small', 'extra-small', '6', 'nz 6', 'au 6'].includes(value)) {
    return 'XS'
  }

  if (['s', 'small', '8', 'nz 8', 'au 8'].includes(value)) {
    return 'S'
  }

  if (['m', 'medium', '10', 'nz 10', 'au 10'].includes(value)) {
    return 'M'
  }

  return 'L'
}

export function normalizeDressSizes(size: unknown): BoutiqueSize[] {
  const values = Array.isArray(size) ? size : [size]
  const normalized = values.map((value) => normalizeDressSize(value))

  return Array.from(new Set(normalized))
}

export function money(value = 0) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function dressSubtitle(dress: Dress) {
  return [dress.brand ?? dress.designer, dress.type, dress.color ?? dress.colour]
    .filter(Boolean)
    .join(' / ')
}
