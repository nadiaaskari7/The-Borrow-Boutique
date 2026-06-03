import { useEffect, useMemo, useRef, useState } from 'react'
import { getDownloadURL, listAll, ref } from 'firebase/storage'
import type { Dress } from '../types'
import { money } from '../utils/dresses'
import { DressCard } from '../components/DressCard'
import { storage } from '../firebase/firebaseConfig'

const GALLERY_NAME_STOP_WORDS = new Set([
  'a',
  'and',
  'by',
  'dress',
  'gown',
  'in',
  'maxi',
  'midi',
  'mini',
  'of',
  'the',
])

function getGalleryNameKeywords(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !GALLERY_NAME_STOP_WORDS.has(word))
}

function getGalleryFolderScore(dressName: string, folderName: string) {
  const dressKeywords = getGalleryNameKeywords(dressName)
  const folderKeywords = new Set(getGalleryNameKeywords(decodeURIComponent(folderName)))

  if (!dressKeywords.length || !folderKeywords.size) return 0

  return dressKeywords.filter((keyword) => folderKeywords.has(keyword)).length / dressKeywords.length
}

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
  const relatedScrollerRef = useRef<HTMLDivElement>(null)
  const customerPhotosScrollerRef = useRef<HTMLDivElement>(null)
  const [relatedScrollState, setRelatedScrollState] = useState({ canScrollLeft: false, canScrollRight: false })
  const [customerPhotoScrollState, setCustomerPhotoScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  })
  const [customerPhotos, setCustomerPhotos] = useState<string[]>([])
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

  function updateRelatedScrollState() {
    const scroller = relatedScrollerRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    setRelatedScrollState({
      canScrollLeft: scroller.scrollLeft > 1,
      canScrollRight: scroller.scrollLeft < maxScrollLeft - 1,
    })
  }

  function updateCustomerPhotoScrollState() {
    const scroller = customerPhotosScrollerRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    setCustomerPhotoScrollState({
      canScrollLeft: scroller.scrollLeft > 1,
      canScrollRight: scroller.scrollLeft < maxScrollLeft - 1,
    })
  }

  useEffect(() => {
    updateRelatedScrollState()
    window.addEventListener('resize', updateRelatedScrollState)

    return () => window.removeEventListener('resize', updateRelatedScrollState)
  }, [relatedDresses])

  useEffect(() => {
    updateCustomerPhotoScrollState()
    window.addEventListener('resize', updateCustomerPhotoScrollState)

    return () => window.removeEventListener('resize', updateCustomerPhotoScrollState)
  }, [customerPhotos])

  useEffect(() => {
    async function loadCustomerPhotos() {
      if (!dress?.name) {
        setCustomerPhotos([])
        return
      }

      try {
        const galleryRoot = await listAll(ref(storage, 'gallery'))
        const matchingFolder = galleryRoot.prefixes
          .map((folder) => ({
            folder,
            score: getGalleryFolderScore(dress.name, folder.name),
          }))
          .filter((match) => match.score >= 0.5)
          .sort((first, second) => second.score - first.score)[0]?.folder

        if (!matchingFolder) {
          setCustomerPhotos([])
          return
        }

        const folder = await listAll(matchingFolder)
        const photoUrls = await Promise.all(folder.items.map((item) => getDownloadURL(item)))
        setCustomerPhotos(photoUrls)
      } catch (error) {
        console.error(error)
        setCustomerPhotos([])
      }
    }

    loadCustomerPhotos()
  }, [dress?.name])

  function scrollRelated(direction: 'left' | 'right') {
    const scroller = relatedScrollerRef.current
    if (!scroller) return

    const card = scroller.querySelector<HTMLElement>('.dress-card')
    const scrollAmount = card ? card.offsetWidth + 20 : scroller.clientWidth * 0.8

    scroller.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  function scrollCustomerPhotos(direction: 'left' | 'right') {
    const scroller = customerPhotosScrollerRef.current
    if (!scroller) return

    const image = scroller.querySelector<HTMLElement>('img')
    const scrollAmount = image ? image.offsetWidth + 16 : scroller.clientWidth * 0.8

    scroller.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

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
          <p className="tax-note">Rental fee. Posting adds a $15 shipping fee.</p>

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
                <input readOnly placeholder="Set automatically when you book" />
              </label>
            </div>

            <p className="booking-note">
              Weekday rentals, Monday to Thursday, are returned the following day. Weekend rentals,
              Friday to Sunday, are returned or posted back with the provided return bag on Monday.
            </p>
          </div>

          <div className="detail-facts rental-summary">
            <div>
              <span>Rental fee</span>
              <strong>{money(dress.rentalPrice)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{deliveryMethod === 'Post' ? '$15' : 'Pick up'}</strong>
            </div>
            <div>
              <span>Sizes</span>
              <strong>{dress.sizes.join(' / ')}</strong>
            </div>
          </div>

          <div className="detail-actions">
            <button onClick={() => onRent(dress.id)} type="button">
              Book rental
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
                Choose your rental start date and delivery method. The return date is set automatically:
                Monday to Thursday rentals are returned the following day, and Friday to Sunday rentals
                are returned the following Monday.
              </p>
            </details>
          </section>
        </aside>
      </section>

      {customerPhotos.length > 0 && (
        <section className="customer-photos-section">
          <div className="section-title">
            <p className="eyebrow">Seen on customers</p>
            <h2>Worn in real life</h2>
          </div>
          <div className="customer-photos-carousel-shell">
            {customerPhotoScrollState.canScrollLeft && (
              <button
                aria-label="Scroll customer photos left"
                className="related-arrow related-arrow-left"
                onClick={() => scrollCustomerPhotos('left')}
                type="button"
              >
                ←
              </button>
            )}
            <div
              className="customer-photos-carousel"
              onScroll={updateCustomerPhotoScrollState}
              ref={customerPhotosScrollerRef}
            >
              {customerPhotos.map((photoUrl, index) => (
                <img alt={`${dress.name} customer photo ${index + 1}`} key={photoUrl} loading="lazy" src={photoUrl} />
              ))}
            </div>
            {customerPhotoScrollState.canScrollRight && (
              <button
                aria-label="Scroll customer photos right"
                className="related-arrow related-arrow-right"
                onClick={() => scrollCustomerPhotos('right')}
                type="button"
              >
                →
              </button>
            )}
          </div>
        </section>
      )}

      {relatedDresses.length > 0 && (
        <section className="related-section">
          <div className="related-heading">
            <div className="section-title">
              <p className="eyebrow">You may also like</p>
              <h2>Similar rentals</h2>
            </div>
          </div>
          <div className="related-carousel-shell">
            {relatedScrollState.canScrollLeft && (
              <button
                aria-label="Scroll similar rentals left"
                className="related-arrow related-arrow-left"
                onClick={() => scrollRelated('left')}
                type="button"
              >
                ←
              </button>
            )}
            <div className="related-carousel" onScroll={updateRelatedScrollState} ref={relatedScrollerRef}>
              {relatedDresses.map((relatedDress) => (
                <DressCard dress={relatedDress} key={relatedDress.id} onOpen={onOpen} />
              ))}
            </div>
            {relatedScrollState.canScrollRight && (
              <button
                aria-label="Scroll similar rentals right"
                className="related-arrow related-arrow-right"
                onClick={() => scrollRelated('right')}
                type="button"
              >
                →
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
