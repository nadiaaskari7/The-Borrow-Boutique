import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import './App.css'
import { Notice } from './components/Notice'
import { SiteHeader } from './components/SiteHeader'
import { db, storage } from './firebase/firebaseConfig'
import { DressesPage } from './pages/DressesPage'
import { HomePage } from './pages/HomePage'
import { InquiryPage } from './pages/InquiryPage'
import { RentPage } from './pages/RentPage'
import { TryOnPage } from './pages/TryOnPage'
import type { Dress, Page, SizeFilter } from './types'
import { normalizeDressSize } from './utils/dresses'

const fallbackDresses: Dress[] = [
  {
    id: 'sample-1',
    name: 'Satin Cowl Midi',
    designer: 'Boutique edit',
    size: 'XS',
    rawSize: '6',
    color: 'Blush',
    rentalPrice: 89,
    bond: 50,
    description: 'A sleek event dress for birthdays, engagement parties, and dinners.',
    available: true,
  },
  {
    id: 'sample-2',
    name: 'Black Tie Gown',
    designer: 'Boutique edit',
    size: 'M',
    rawSize: '10',
    color: 'Black',
    rentalPrice: 129,
    bond: 80,
    description: 'Floor-length gown with a structured bodice and soft skirt.',
    available: true,
  },
]

function App() {
  const [page, setPage] = useState<Page>('home')
  const [dresses, setDresses] = useState<Dress[]>([])
  const [selectedSize, setSelectedSize] = useState<SizeFilter>('All')
  const [selectedDressId, setSelectedDressId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    async function loadDresses() {
      setIsLoading(true)
      setLoadError('')

      try {
        const snapshot = await getDocs(query(collection(db, 'Dresses'), orderBy('name')))
        const loaded = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data() as Partial<Omit<Dress, 'id'>>
            const imageUrls = data.imageUrls ?? []
            let imageUrl = data.imageUrl ?? imageUrls[0]

            if (!imageUrl && data.imagePath) {
              imageUrl = await getDownloadURL(ref(storage, data.imagePath))
            }

            const rawSize = String(data.rawSize ?? data.size ?? '')

            return {
              id: doc.id,
              name: data.name ?? 'Untitled dress',
              size: normalizeDressSize(data.size),
              rawSize,
              brand: data.brand,
              type: data.type,
              designer: data.designer ?? data.brand,
              color: data.color ?? data.colour,
              colour: data.colour,
              price: Number(data.price ?? data.rentalPrice ?? 0),
              rentalPrice: Number(data.rentalPrice ?? data.price ?? 0),
              bond: Number(data.bond ?? 0),
              imageUrl,
              hoverImageUrl: data.hoverImageUrl ?? imageUrls[1],
              imageUrls,
              imagePath: data.imagePath,
              description: data.description,
              available: data.available ?? true,
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

  const filteredDresses = useMemo(
    () => dresses.filter((dress) => selectedSize === 'All' || dress.size === selectedSize),
    [dresses, selectedSize],
  )

  const selectedDress = dresses.find((dress) => dress.id === selectedDressId) ?? dresses[0]

  function selectDressAndPage(dressId: string, nextPage: Page) {
    setSelectedDressId(dressId)
    setPage(nextPage)
  }

  async function handleInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))

    await addDoc(collection(db, 'inquiries'), {
      ...data,
      status: 'new',
      createdAt: serverTimestamp(),
    })

    event.currentTarget.reset()
    setNotice('Inquiry sent. You can reply from Firebase or your admin tools.')
  }

  async function handleTryOn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))

    await addDoc(collection(db, 'tryOnBookings'), {
      ...data,
      status: 'requested',
      createdAt: serverTimestamp(),
    })

    event.currentTarget.reset()
    setNotice('Try-on request saved. Confirm the time before it is locked in.')
  }

  async function handleRental(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDress) return

    const data = Object.fromEntries(new FormData(event.currentTarget))

    await addDoc(collection(db, 'rentalRequests'), {
      ...data,
      dressId: selectedDress.id,
      dressName: selectedDress.name,
      size: selectedDress.size,
      rawSize: selectedDress.rawSize,
      rentalPrice: selectedDress.rentalPrice,
      bond: selectedDress.bond ?? 0,
      paymentStatus: selectedDress.paymentLink ? 'payment-link-opened' : 'payment-pending',
      status: 'requested',
      createdAt: serverTimestamp(),
    })

    if (selectedDress.paymentLink) {
      window.open(selectedDress.paymentLink, '_blank', 'noopener,noreferrer')
      setNotice('Rental request saved and the payment page has opened.')
    } else {
      setNotice('Rental request saved. Add a Stripe payment link to this dress to take payment online.')
    }

    event.currentTarget.reset()
  }

  return (
    <div className="app-shell">
      <SiteHeader currentPage={page} onNavigate={setPage} />
      <Notice message={notice} onDismiss={() => setNotice('')} />

      {page === 'home' && (
        <HomePage
          dresses={dresses}
          onAsk={(dressId) => selectDressAndPage(dressId, 'inquiry')}
          onNavigate={setPage}
          onRent={(dressId) => selectDressAndPage(dressId, 'rent')}
        />
      )}

      {page === 'dresses' && (
        <DressesPage
          dresses={filteredDresses}
          isLoading={isLoading}
          loadError={loadError}
          onAsk={(dressId) => selectDressAndPage(dressId, 'inquiry')}
          onRent={(dressId) => selectDressAndPage(dressId, 'rent')}
          onSelectSize={setSelectedSize}
          selectedSize={selectedSize}
        />
      )}

      {page === 'inquiry' && (
        <InquiryPage dresses={dresses} onSubmit={handleInquiry} selectedDress={selectedDress} />
      )}

      {page === 'try-on' && (
        <TryOnPage dresses={dresses} onSubmit={handleTryOn} selectedDress={selectedDress} />
      )}

      {page === 'rent' && <RentPage onSubmit={handleRental} selectedDress={selectedDress} />}
    </div>
  )
}

export default App
