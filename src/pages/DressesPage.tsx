import type { Dress, DressFilters, SizeFilter } from '../types'
import { PageHeading } from '../components/PageHeading'
import { DressGrid } from '../components/DressGrid'
import { CustomSelect } from '../components/CustomSelect'
import { boutiqueSizes } from '../utils/dresses'

export function DressesPage({
  brands,
  colours,
  dresses,
  filters,
  isLoading,
  loadError,
  onClearFilters,
  onFilterChange,
  onOpen,
  types,
}: {
  brands: string[]
  colours: string[]
  dresses: Dress[]
  filters: DressFilters
  isLoading: boolean
  loadError: string
  onClearFilters: () => void
  onFilterChange: (filters: DressFilters) => void
  onOpen: (dressId: string) => void
  types: string[]
}) {
  const updateFilter = <Key extends keyof DressFilters>(key: Key, value: DressFilters[Key]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <main className="page-layout">
      <PageHeading eyebrow="Collection" title="Browse the wardrobe">
        Filter by size, colour, or brand, then open a dress to see all images and rental details.
      </PageHeading>

      {loadError && <p className="warning">{loadError}</p>}
      {isLoading ? (
        <p className="empty-state">Loading dresses from Firebase...</p>
      ) : (
        <div className="catalogue-layout">
          <aside className="filter-panel" aria-label="Dress filters">
            <div className="filter-panel-heading">
              <h2>Filter</h2>
              <button className="text-button" onClick={onClearFilters} type="button">
                Clear
              </button>
            </div>

            <section className="filter-group">
              <h3>Size</h3>
              <div className="size-filter" role="tablist" aria-label="Filter dresses by size">
                {(['All', ...boutiqueSizes] as SizeFilter[]).map((size) => (
                  <button
                    className={filters.size === size ? 'active' : ''}
                    key={size}
                    onClick={() => updateFilter('size', size)}
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>

            <label className="filter-group">
              <span>Colour</span>
              <CustomSelect
                onChange={(value) => updateFilter('colour', value)}
                options={[{ label: 'All colours', value: 'All' }, ...colours.map((colour) => ({ label: colour, value: colour }))]}
                value={filters.colour}
              />
            </label>

            <label className="filter-group">
              <span>Brand</span>
              <CustomSelect
                onChange={(value) => updateFilter('brand', value)}
                options={[{ label: 'All brands', value: 'All' }, ...brands.map((brand) => ({ label: brand, value: brand }))]}
                value={filters.brand}
              />
            </label>

            <label className="filter-group">
              <span>Type</span>
              <CustomSelect
                onChange={(value) => updateFilter('type', value)}
                options={[{ label: 'All types', value: 'All' }, ...types.map((type) => ({ label: type, value: type }))]}
                value={filters.type}
              />
            </label>

            <label className="filter-group">
              <span>Price</span>
              <div className="price-slider">
                <input
                  max="250"
                  min="0"
                  onChange={(event) => updateFilter('maxPrice', Number(event.target.value))}
                  step="5"
                  type="range"
                  value={filters.maxPrice}
                />
                <div>
                  <span>$0</span>
                  <strong>Up to ${filters.maxPrice}</strong>
                  <span>$250+</span>
                </div>
              </div>
            </label>
          </aside>

          <section className="catalogue-results">
            <div className="result-count">
              <span>{dresses.length} dresses</span>
            </div>
            <DressGrid dresses={dresses} onOpen={onOpen} />
          </section>
        </div>
      )}
    </main>
  )
}
