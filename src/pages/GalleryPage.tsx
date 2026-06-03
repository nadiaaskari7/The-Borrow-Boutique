import { useEffect, useState } from 'react'
import { getDownloadURL, listAll, ref } from 'firebase/storage'
import { PageHeading } from '../components/PageHeading'
import { storage } from '../firebase/firebaseConfig'

type GalleryPhoto = {
  dressName: string
  imageUrl: string
}

function formatDressName(folderName: string) {
  return decodeURIComponent(folderName).replace(/[-_]+/g, ' ')
}

function shufflePhotos(photos: GalleryPhoto[]) {
  return [...photos].sort(() => Math.random() - 0.5)
}

export function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGallery() {
      setIsLoading(true)
      setError('')

      try {
        const galleryRoot = await listAll(ref(storage, 'gallery'))
        const loadedGroups = await Promise.all(
          galleryRoot.prefixes.map(async (dressFolder) => {
            const folderContents = await listAll(dressFolder)
            const images = await Promise.all(folderContents.items.map((item) => getDownloadURL(item)))

            return {
              dressName: formatDressName(dressFolder.name),
              images,
            }
          }),
        )

        const loadedPhotos = loadedGroups.flatMap((group) =>
          group.images.map((imageUrl) => ({
            dressName: group.dressName,
            imageUrl,
          })),
        )

        setPhotos(shufflePhotos(loadedPhotos))
      } catch (galleryError) {
        console.error(galleryError)
        setError('Gallery photos could not be loaded from Firebase Storage.')
      } finally {
        setIsLoading(false)
      }
    }

    loadGallery()
  }, [])

  return (
    <main className="info-page gallery-page">
      <PageHeading eyebrow="Customer gallery" title="Seen on you">
        Real rental moments from The Borrow Boutique customers.
      </PageHeading>

      {isLoading && <p className="empty-state">Loading customer photos...</p>}
      {error && <p className="warning">{error}</p>}
      {!isLoading && !error && photos.length === 0 && (
        <p className="empty-state">
          Customer photos will appear here once images are added to Firebase Storage under
          gallery/dress-name.
        </p>
      )}

      <section className="customer-gallery-grid mixed-gallery-grid">
        {photos.map((photo, index) => (
          <article className="gallery-photo-card" key={photo.imageUrl}>
            <img alt={`${photo.dressName} customer photo ${index + 1}`} loading="lazy" src={photo.imageUrl} />
            <p>{photo.dressName}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
