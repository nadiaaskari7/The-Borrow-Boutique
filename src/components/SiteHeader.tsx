import type { Page } from '../types'

const pageLabels: Partial<Record<Page, string>> = {
  home: 'Home',
  dresses: 'Dresses',
  'how-it-works': 'How it works',
  faq: 'FAQ',
  'try-on': 'Try-on',
  inquiry: 'Contact',
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
      <button className="header-cta" onClick={() => onNavigate('dresses')} type="button">
        Browse collection
      </button>
    </header>
  )
}
