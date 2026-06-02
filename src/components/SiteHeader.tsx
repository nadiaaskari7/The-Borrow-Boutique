import type { DressFilters, Page } from '../types'

export function SiteHeader({
  currentPage,
  onBrowseFilter,
  onNavigate,
}: {
  currentPage: Page
  onBrowseFilter: (filters: Partial<DressFilters>) => void
  onNavigate: (page: Page) => void
}) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => onNavigate('home')} type="button">
        <span>The Borrow Boutique</span>
        <small>Dress rentals</small>
      </button>
      <nav aria-label="Primary navigation">
        <button className={currentPage === 'home' ? 'active' : ''} onClick={() => onNavigate('home')} type="button">
          Home
        </button>
        <div className="nav-dropdown">
          <button
            className={currentPage === 'dresses' || currentPage === 'dress-detail' ? 'active' : ''}
            onClick={() => onNavigate('dresses')}
            type="button"
          >
            Dresses
          </button>
          <div className="dropdown-menu">
            <div>
              <span>By type</span>
              {['Mini', 'Midi', 'Maxi'].map((type) => (
                <button key={type} onClick={() => onBrowseFilter({ type })} type="button">
                  {type}
                </button>
              ))}
            </div>
            <div>
              <span>By size</span>
              {(['XS', 'S', 'M', 'L'] as const).map((size) => (
                <button key={size} onClick={() => onBrowseFilter({ size })} type="button">
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          className={currentPage === 'how-it-works' ? 'active' : ''}
          onClick={() => onNavigate('how-it-works')}
          type="button"
        >
          How it works
        </button>
        <button className={currentPage === 'faq' ? 'active' : ''} onClick={() => onNavigate('faq')} type="button">
          FAQ
        </button>
        <button
          className={currentPage === 'try-on' ? 'active' : ''}
          onClick={() => onNavigate('try-on')}
          type="button"
        >
          Try-on
        </button>
        <button
          className={currentPage === 'inquiry' ? 'active' : ''}
          onClick={() => onNavigate('inquiry')}
          type="button"
        >
          Contact
        </button>
      </nav>
      <button className="header-cta" onClick={() => onNavigate('dresses')} type="button">
        Browse collection
      </button>
    </header>
  )
}
