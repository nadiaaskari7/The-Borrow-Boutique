export type Page = 'home' | 'dresses' | 'try-on' | 'inquiry' | 'rent'

export type BoutiqueSize = 'XS' | 'S' | 'M' | 'L'
export type SizeFilter = 'All' | BoutiqueSize

export type Dress = {
  id: string
  name: string
  size: BoutiqueSize
  rawSize?: string
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
  paymentLink?: string
}
