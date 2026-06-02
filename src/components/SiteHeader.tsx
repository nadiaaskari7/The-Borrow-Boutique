import type { Page } from '../types'

const pageLabels: Record<Page, string> = {
  home: 'Home',
  dresses: 'Dresses',
  'try-on': 'Try-ons',
  inquiry: 'Inquiries',
  rent: 'Rent',
}

export function SiteHeader({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => onNavigate('home')} type="button">
        <span>The Borrow Boutique</span>
        <small>Dress rentals</small>
      </button>
      <nav aria-label="Primary navigation">
        {(Object.keys(pageLabels) as Page[]).map((page) => (
          <button
            className={currentPage === page ? 'active' : ''}
            key={page}
            onClick={() => onNavigate(page)}
            type="button"
          >
            {pageLabels[page]}
          </button>
        ))}
      </nav>
    </header>
  )
}
