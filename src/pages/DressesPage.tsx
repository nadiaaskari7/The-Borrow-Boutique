import type { Dress, SizeFilter } from '../types'
import { PageHeading } from '../components/PageHeading'
import { DressGrid } from '../components/DressGrid'
import { boutiqueSizes } from '../utils/dresses'

export function DressesPage({
  dresses,
  selectedSize,
  isLoading,
  loadError,
  onSelectSize,
  onAsk,
  onRent,
}: {
  dresses: Dress[]
  selectedSize: SizeFilter
  isLoading: boolean
  loadError: string
  onSelectSize: (size: SizeFilter) => void
  onAsk: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  return (
    <main className="page-layout">
      <PageHeading eyebrow="Browse by size" title="Find your fit">
        Dresses are grouped into the simple boutique size range: XS, S, M, and L.
      </PageHeading>

      {loadError && <p className="warning">{loadError}</p>}
      {isLoading ? (
        <p className="empty-state">Loading dresses from Firebase...</p>
      ) : (
        <>
          <div className="size-filter" role="tablist" aria-label="Filter dresses by size">
            {(['All', ...boutiqueSizes] as SizeFilter[]).map((size) => (
              <button
                className={selectedSize === size ? 'active' : ''}
                key={size}
                onClick={() => onSelectSize(size)}
                type="button"
              >
                {size}
              </button>
            ))}
          </div>
          <DressGrid dresses={dresses} onAsk={onAsk} onRent={onRent} />
        </>
      )}
    </main>
  )
}
