import { useLocation, useNavigate } from 'react-router-dom'
import type { DressFilters } from '../types'

export function SiteHeader({
  onBrowseFilter,
}: {
  onBrowseFilter: (filters: Partial<DressFilters>) => void
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isDresses = pathname === '/dresses' || pathname.startsWith('/dresses/')

  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigate('/')} type="button">
        <span>The Borrow Boutique</span>
        <small>Dress rentals</small>
      </button>
      <nav aria-label="Primary navigation">
        <button className={pathname === '/' ? 'active' : ''} onClick={() => navigate('/')} type="button">
          Home
        </button>
        <div className="nav-dropdown">
          <button
            className={isDresses ? 'active' : ''}
            onClick={() => navigate('/dresses')}
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
          className={pathname === '/how-it-works' ? 'active' : ''}
          onClick={() => navigate('/how-it-works')}
          type="button"
        >
          How it works
        </button>
        <button
          className={pathname === '/gallery' ? 'active' : ''}
          onClick={() => navigate('/gallery')}
          type="button"
        >
          Gallery
        </button>
        <button
          className={pathname === '/faq' ? 'active' : ''}
          onClick={() => navigate('/faq')}
          type="button"
        >
          FAQ
        </button>
        <button
          className={pathname === '/try-on' ? 'active' : ''}
          onClick={() => navigate('/try-on')}
          type="button"
        >
          Try-on
        </button>
        <button
          className={pathname === '/inquiry' ? 'active' : ''}
          onClick={() => navigate('/inquiry')}
          type="button"
        >
          Contact
        </button>
      </nav>
      <button className="header-cta" onClick={() => navigate('/dresses')} type="button">
        Browse collection
      </button>
    </header>
  )
}
