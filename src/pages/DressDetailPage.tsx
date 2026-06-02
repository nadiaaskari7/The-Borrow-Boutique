import { useMemo, useState } from 'react'
import type { Dress } from '../types'
import { money } from '../utils/dresses'
import { DressGrid } from '../components/DressGrid'

export function DressDetailPage({
  dress,
  dresses,
  onBack,
  onAsk,
  onOpen,
  onRent,
}: {
  dress?: Dress
  dresses: Dress[]
  onBack: () => void
  onAsk: (dressId: string) => void
  onOpen: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  const images = useMemo(
    () => [dress?.imageUrl, ...(dress?.imageUrls ?? [])].filter(Boolean) as string[],
    [dress],
  )
  const uniqueImages = Array.from(new Set(images))
  const [activeImage, setActiveImage] = useState(0)
  const [deliveryMethod, setDeliveryMethod] = useState<'Post' | 'Pick up'>('Post')
  const currentImage = uniqueImages[activeImage] ?? uniqueImages[0]
  const relatedDresses = useMemo(() => {
    if (!dress) return []

    const related = dresses.filter((candidate) => {
      if (candidate.id === dress.id) return false

      const sameType = Boolean(dress.type && candidate.type === dress.type)
      const sharedSize = candidate.sizes.some((size) => dress.sizes.includes(size))

      return sameType || sharedSize
    })

    const fallback = dresses.filter(
      (candidate) => candidate.id !== dress.id && !related.some((relatedDress) => relatedDress.id === candidate.id),
    )

    return [...related, ...fallback].slice(0, 4)
  }, [dress, dresses])

  if (!dress) {
    return (
      <main className="page-layout">
        <button className="text-button" onClick={onBack} type="button">
          Back to dresses
        </button>
        <p className="empty-state">Choose a dress to view more details.</p>
      </main>
    )
  }

  return (
    <main className="detail-page">
      <button className="text-button" onClick={onBack} type="button">
        Back to dresses
      </button>
      <section className="dress-detail">
        <div className="detail-gallery">
          {currentImage ? (
            <img className="detail-main-image" src={currentImage} alt={dress.name} />
          ) : (
            <div className="detail-main-image image-placeholder">
              <span>{dress.name}</span>
            </div>
          )}
          {uniqueImages.length > 1 && (
            <div className="thumbnail-row" aria-label="Dress images">
              {uniqueImages.map((image, index) => (
                <button
                  className={activeImage === index ? 'active' : ''}
                  key={image}
                  onClick={() => setActiveImage(index)}
                  type="button"
                >
                  <img src={image} alt={`${dress.name} view ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="detail-panel">
          <p className="product-brand">{dress.brand ?? dress.designer ?? 'The Borrow Boutique'}</p>
          <h1>{dress.name}</h1>
          <p className="product-price">{money(dress.rentalPrice)}</p>
          <p className="tax-note">Rental fee. Bond and delivery are confirmed with your booking.</p>

          <div className="booking-panel">
            <label>
              Delivery method
              <div className="segmented-control" role="group" aria-label="Delivery method">
                {(['Post', 'Pick up'] as const).map((method) => (
                  <button
                    className={deliveryMethod === method ? 'active' : ''}
                    key={method}
                    onClick={() => setDeliveryMethod(method)}
                    type="button"
                  >
                    {method}
                  </button>
                ))}
              </div>
            </label>

            <div className="date-grid">
              <label>
                Rental start
                <input type="date" />
              </label>
              <label>
                Return date
                <input type="date" />
              </label>
            </div>

            <p className="booking-note">
              For weekend events, choose the date you need the dress available. Rural or day events may
              need an earlier delivery date.
            </p>
          </div>

          <div className="detail-facts rental-summary">
            <div>
              <span>Rental fee</span>
              <strong>{money(dress.rentalPrice)}</strong>
            </div>
            <div>
              <span>Bond</span>
              <strong>{money(dress.bond ?? 0)}</strong>
            </div>
            <div>
              <span>Sizes</span>
              <strong>{dress.sizes.join(' / ')}</strong>
            </div>
          </div>

          <div className="detail-actions">
            <button onClick={() => onRent(dress.id)} type="button">
              Request rental
            </button>
            <button className="secondary" onClick={() => onAsk(dress.id)} type="button">
              Ask a question
            </button>
          </div>

          <section className="product-accordions">
            <details open>
              <summary>Description</summary>
              <p>{dress.description || 'A curated rental piece ready for your next event.'}</p>
            </details>
            <details>
              <summary>Fit and details</summary>
              <dl className="compact-details">
                <div>
                  <dt>Brand</dt>
                  <dd>{dress.brand ?? dress.designer ?? 'The Borrow Boutique'}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{dress.type ?? 'Dress'}</dd>
                </div>
                {dress.color && (
                  <div>
                    <dt>Colour</dt>
                    <dd>{dress.color}</dd>
                  </div>
                )}
                <div>
                  <dt>Size</dt>
                  <dd>{dress.sizes.join(' / ')}</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>How rental works</summary>
              <p>
                Submit a rental request with your dates. You will receive confirmation before the
                rental is locked in. Payment links can be attached per dress when configured.
              </p>
            </details>
          </section>
        </aside>
      </section>

      {relatedDresses.length > 0 && (
        <section className="related-section">
          <div className="section-title">
            <p className="eyebrow">You may also like</p>
            <h2>Similar rentals</h2>
          </div>
          <DressGrid dresses={relatedDresses} onOpen={onOpen} />
        </section>
      )}
    </main>
  )
}
