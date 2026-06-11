import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import './App.css'
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
import type { Dress, DressFilters } from './types'
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
  const navigate = useNavigate()
  const location = useLocation()
  const [dresses, setDresses] = useState<Dress[]>([])
  const [filters, setFilters] = useState<DressFilters>({
    size: 'All',
    colour: 'All',
    brand: 'All',
    type: 'All',
    maxPrice: 250,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const payment = params.get('payment')
    if (payment === 'success') {
      setNotice('Payment successful! Your rental is confirmed. We will be in touch shortly.')
      navigate(location.pathname, { replace: true })
    } else if (payment === 'cancelled') {
      setNotice('Payment was cancelled. Your rental request has not been completed.')
      navigate(location.pathname, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
              bookedDates: Array.isArray(data.bookedDates) ? data.bookedDates.filter(Boolean) : [],
            }
          }),
        )

        setDresses(loaded.length ? loaded : fallbackDresses)
      } catch (error) {
        console.error(error)
        setLoadError('Firebase dresses could not be loaded, so sample dresses are showing for now.')
        setDresses(fallbackDresses)
      } finally {
        setIsLoading(false)
      }
    }

    loadDresses()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

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

  function browseWithFilters(nextFilters: Partial<DressFilters>) {
    setFilters({ size: 'All', colour: 'All', brand: 'All', type: 'All', maxPrice: 250, ...nextFilters })
    navigate('/dresses')
  }

  return (
    <div className="app-shell">
      <SiteHeader onBrowseFilter={browseWithFilters} />
      <Notice message={notice} onDismiss={() => setNotice('')} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              dresses={dresses}
              onOpen={(dressId) => navigate(`/dresses/${dressId}`)}
            />
          }
        />
        <Route
          path="/dresses"
          element={
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
              onOpen={(dressId) => navigate(`/dresses/${dressId}`)}
              types={filterOptions.types}
            />
          }
        />
        <Route
          path="/dresses/:dressId"
          element={
            <DressDetailPage
              dresses={dresses}
              onAsk={(dressId) => navigate(`/inquiry?dress=${dressId}`)}
              onBack={() => navigate('/dresses')}
              onOpen={(dressId) => navigate(`/dresses/${dressId}`)}
              onRent={(dressId) => navigate(`/dresses/${dressId}/rent`)}
            />
          }
        />
        <Route
          path="/dresses/:dressId/rent"
          element={
            <RentPage
              dresses={dresses}
              onNotice={setNotice}
            />
          }
        />
        <Route
          path="/inquiry"
          element={<InquiryPage dresses={dresses} onNotice={setNotice} />}
        />
        <Route
          path="/try-on"
          element={<TryOnPage dresses={dresses} onNotice={setNotice} />}
        />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>

      <Footer />
    </div>
  )
}

export default App
