import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import './App.css'
import {
  createInquiry,
  createRentalRequest,
  createTryOnBooking,
  formDataToPayload,
} from './api/bookings'
import { Footer } from './components/Footer'
import { Notice } from './components/Notice'
import { SiteHeader } from './components/SiteHeader'
import { db, storage } from './firebase/firebaseConfig'
import { DressesPage } from './pages/DressesPage'
import { DressDetailPage } from './pages/DressDetailPage'
import { FaqPage } from './pages/FaqPage'
import { GalleryPage } from './pages/GalleryPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { HomePage } from './pages/HomePage'
import { InquiryPage } from './pages/InquiryPage'
import { RentPage } from './pages/RentPage'
import { TermsPage } from './pages/TermsPage'
import { TryOnPage } from './pages/TryOnPage'
import type { Dress, DressFilters, Page } from './types'
import { normalizeDressSizes } from './utils/dresses'

const fallbackDresses: Dress[] = [
  {
    id: 'sample-1',
    name: 'Satin Cowl Midi',
    designer: 'Boutique edit',
    size: 'XS',
    sizes: ['XS'],
    rawSize: '6',
    rawSizes: ['6'],
    color: 'Blush',
    rentalPrice: 89,
    description: 'A sleek event dress for birthdays, engagement parties, and dinners.',
    available: true,
    isNew: true,
  },
  {
    id: 'sample-2',
    name: 'Black Tie Gown',
    designer: 'Boutique edit',
    size: 'M',
    sizes: ['M'],
    rawSize: '10',
    rawSizes: ['10'],
    color: 'Black',
    rentalPrice: 129,
    description: 'Floor-length gown with a structured bodice and soft skirt.',
    available: true,
    isNew: false,
  },
]

function App() {
  const [page, setPage] = useState<Page>('home')
  const [dresses, setDresses] = useState<Dress[]>([])
  const [filters, setFilters] = useState<DressFilters>({
    size: 'All',
    colour: 'All',
    brand: 'All',
    type: 'All',
    maxPrice: 250,
  })
  const [selectedDressId, setSelectedDressId] = useState('')
  const [selectedRentalSize, setSelectedRentalSize] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment === 'success') {
      setNotice('Payment successful! Your rental is confirmed. We will be in touch shortly.')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (payment === 'cancelled') {
      setNotice('Payment was cancelled. Your rental request has not been completed.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    async function loadDresses() {
      setIsLoading(true)
      setLoadError('')

      try {
        const snapshot = await getDocs(query(collection(db, 'Dresses'), orderBy('name')))
        const loaded = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data() as Partial<Omit<Dress, 'id'>> & { new?: boolean }
            const imageUrls = data.imageUrls ?? []
            let imageUrl = data.imageUrl ?? imageUrls[0]

            if (!imageUrl && data.imagePath) {
              imageUrl = await getDownloadURL(ref(storage, data.imagePath))
            }

            const firebaseSize = data.rawSize ?? data.size
            const rawSizes = Array.isArray(firebaseSize)
              ? firebaseSize.map((size) => String(size))
              : [String(firebaseSize ?? '')]
            const sizes = normalizeDressSizes(firebaseSize)

            return {
              id: doc.id,
              name: data.name ?? 'Untitled dress',
              size: sizes[0],
              sizes,
              rawSize: rawSizes[0],
              rawSizes,
              brand: data.brand,
              type: data.type,
              designer: data.designer ?? data.brand,
              color: data.color ?? data.colour,
              colour: data.colour,
              price: Number(data.price ?? data.rentalPrice ?? 0),
              rentalPrice: Number(data.rentalPrice ?? data.price ?? 0),
              imageUrl,
              hoverImageUrl: data.hoverImageUrl ?? imageUrls[1],
              imageUrls,
              imagePath: data.imagePath,
              description: data.description,
              available: data.available ?? true,
              isNew: Boolean(data.isNew ?? data.new),
              paymentLink: data.paymentLink,
            }
          }),
        )

        const nextDresses = loaded.length ? loaded : fallbackDresses
        setDresses(nextDresses)
        setSelectedDressId(nextDresses[0]?.id ?? '')
      } catch (error) {
        console.error(error)
        setLoadError('Firebase dresses could not be loaded, so sample dresses are showing for now.')
        setDresses(fallbackDresses)
        setSelectedDressId(fallbackDresses[0].id)
      } finally {
        setIsLoading(false)
      }
    }

    loadDresses()
  }, [])

  const filterOptions = useMemo(() => {
    const colours = Array.from(
      new Set(dresses.map((dress) => dress.color ?? dress.colour).filter(Boolean) as string[]),
    ).sort()
    const brands = Array.from(
      new Set(dresses.map((dress) => dress.brand ?? dress.designer).filter(Boolean) as string[]),
    ).sort()
    const types = Array.from(new Set(dresses.map((dress) => dress.type).filter(Boolean) as string[])).sort()

    return { colours, brands, types }
  }, [dresses])

  const filteredDresses = useMemo(
    () =>
      dresses.filter((dress) => {
        const dressColour = dress.color ?? dress.colour
        const dressBrand = dress.brand ?? dress.designer

        return (
          (filters.size === 'All' || dress.sizes.includes(filters.size)) &&
          (filters.colour === 'All' || dressColour === filters.colour) &&
          (filters.brand === 'All' || dressBrand === filters.brand) &&
          (filters.type === 'All' || dress.type === filters.type) &&
          dress.rentalPrice <= filters.maxPrice
        )
      }),
    [dresses, filters],
  )

  const selectedDress = dresses.find((dress) => dress.id === selectedDressId) ?? dresses[0]

  useEffect(() => {
    if (!selectedDress) return

    if (!selectedDress.sizes.includes(selectedRentalSize as Dress['size'])) {
      setSelectedRentalSize(selectedDress.sizes[0] ?? '')
    }
  }, [selectedDress, selectedRentalSize])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [page, selectedDressId])

  function selectDressAndPage(dressId: string, nextPage: Page) {
    const nextDress = dresses.find((dress) => dress.id === dressId)
    if (nextDress && (dressId !== selectedDressId || !nextDress.sizes.includes(selectedRentalSize as Dress['size']))) {
      setSelectedRentalSize(nextDress.sizes[0] ?? '')
    }
    setSelectedDressId(dressId)
    setPage(nextPage)
  }

  function browseWithFilters(nextFilters: Partial<DressFilters>) {
    setFilters({ size: 'All', colour: 'All', brand: 'All', type: 'All', maxPrice: 250, ...nextFilters })
    setPage('dresses')
  }

  async function handleInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = formDataToPayload(form)
    const inquiryDress = dresses.find((dress) => dress.id === data.dressId)

    await createInquiry({
      ...data,
      dressName: inquiryDress?.name ?? '',
    })

    form.reset()
    setNotice('Inquiry sent. We will reply as soon as possible.')
  }

  async function handleTryOn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = formDataToPayload(form)
    const tryOnDress = dresses.find((dress) => dress.id === data.dressId)

    await createTryOnBooking({
      ...data,
      dressName: tryOnDress?.name ?? '',
    })

    form.reset()
    setNotice('Try-on request sent. We will confirm the time before it is locked in.')
  }

  async function handleRental(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDress) return

    const form = event.currentTarget
    const data = formDataToPayload(form)

    const result = await createRentalRequest({
      ...data,
      dressId: selectedDress.id,
      dressName: selectedDress.name,
      size: String(data.rentalSize ?? selectedRentalSize ?? selectedDress.size),
      sizes: selectedDress.sizes.join(', '),
      rawSize: selectedDress.rawSize ?? '',
      rawSizes: selectedDress.rawSizes?.join(', ') ?? '',
      rentalPrice: String(selectedDress.rentalPrice),
      paymentLink: selectedDress.paymentLink ?? '',
    })

    if (result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl
    } else {
      setNotice('Rental request sent. We will confirm availability and payment details.')
    }

    form.reset()
  }

  return (
    <div className="app-shell">
      <SiteHeader currentPage={page} onBrowseFilter={browseWithFilters} onNavigate={setPage} />
      <Notice message={notice} onDismiss={() => setNotice('')} />

      {page === 'home' && (
        <HomePage
          dresses={dresses}
          onNavigate={setPage}
          onOpen={(dressId) => selectDressAndPage(dressId, 'dress-detail')}
        />
      )}

      {page === 'dresses' && (
        <DressesPage
          brands={filterOptions.brands}
          colours={filterOptions.colours}
          dresses={filteredDresses}
          filters={filters}
          isLoading={isLoading}
          loadError={loadError}
          onClearFilters={() =>
            setFilters({ size: 'All', colour: 'All', brand: 'All', type: 'All', maxPrice: 250 })
          }
          onFilterChange={setFilters}
          onOpen={(dressId) => selectDressAndPage(dressId, 'dress-detail')}
          types={filterOptions.types}
        />
      )}

      {page === 'dress-detail' && (
        <DressDetailPage
          dress={selectedDress}
          dresses={dresses}
          onAsk={(dressId) => selectDressAndPage(dressId, 'inquiry')}
          onBack={() => setPage('dresses')}
          onOpen={(dressId) => selectDressAndPage(dressId, 'dress-detail')}
          onRent={(dressId) => selectDressAndPage(dressId, 'rent')}
          onSizeChange={setSelectedRentalSize}
          selectedSize={selectedRentalSize}
        />
      )}

      {page === 'how-it-works' && <HowItWorksPage onNavigate={setPage} />}

      {page === 'gallery' && <GalleryPage />}

      {page === 'faq' && <FaqPage onNavigate={setPage} />}

      {page === 'terms' && <TermsPage onNavigate={setPage} />}

      {page === 'inquiry' && (
        <InquiryPage dresses={dresses} onSubmit={handleInquiry} selectedDress={selectedDress} />
      )}

      {page === 'try-on' && (
        <TryOnPage dresses={dresses} onSubmit={handleTryOn} selectedDress={selectedDress} />
      )}

      {page === 'rent' && (
        <RentPage
          onSizeChange={setSelectedRentalSize}
          onSubmit={handleRental}
          selectedDress={selectedDress}
          selectedSize={selectedRentalSize}
        />
      )}

      <Footer onNavigate={setPage} />
    </div>
  )
}

export default App
