export type Page =
  | 'home'
  | 'dresses'
  | 'dress-detail'
  | 'try-on'
  | 'inquiry'
  | 'rent'
  | 'how-it-works'
  | 'faq'

export type BoutiqueSize = 'XS' | 'S' | 'M' | 'L'
export type SizeFilter = 'All' | BoutiqueSize

export type DressFilters = {
  size: SizeFilter
  colour: string
  brand: string
  type: string
  maxPrice: number
}

export type Dress = {
  id: string
  name: string
  size: BoutiqueSize
  sizes: BoutiqueSize[]
  rawSize?: string
  rawSizes?: string[]
  brand?: string
  type?: string
  designer?: string
  color?: string
  colour?: string
  price?: number
  rentalPrice: number
  bond?: number
  imageUrl?: string
  hoverImageUrl?: string
  imageUrls?: string[]
  imagePath?: string
  description?: string
  available?: boolean
  isNew?: boolean
  paymentLink?: string
}
