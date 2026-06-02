import type { Dress } from '../types'

export function DressImage({ dress, className = '' }: { dress?: Dress; className?: string }) {
  const primaryImage = dress?.imageUrl ?? dress?.imageUrls?.[0]
  const hoverImage = dress?.hoverImageUrl ?? dress?.imageUrls?.[1]

  if (primaryImage) {
    return (
      <div className={`dress-image ${hoverImage ? 'has-hover-image' : ''} ${className}`}>
        <img className="primary-image" src={primaryImage} alt={dress?.name ?? 'Dress'} />
        {hoverImage && <img className="hover-image" src={hoverImage} alt="" aria-hidden="true" />}
      </div>
    )
  }

  return (
    <div className={`dress-image image-placeholder ${className}`}>
      <span>{dress?.name ?? 'The Borrow Boutique'}</span>
    </div>
  )
}
