import type { Page } from '../types'

export function Footer({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-brand-name">The Borrow Boutique</span>
          <span className="footer-brand-tag">Dress Rentals</span>
          <p>
            A curated rental wardrobe for every occasion. Wear beautiful, dress sustainably, and
            keep your wardrobe clutter-free.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <nav>
            <button onClick={() => onNavigate('dresses')} type="button">
              Browse dresses
            </button>
            <button onClick={() => onNavigate('how-it-works')} type="button">
              How it works
            </button>
            <button onClick={() => onNavigate('faq')} type="button">
              FAQ
            </button>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Book</h4>
          <nav>
            <button onClick={() => onNavigate('try-on')} type="button">
              Book a try-on
            </button>
            <button onClick={() => onNavigate('dresses')} type="button">
              Rent a dress
            </button>
            <button onClick={() => onNavigate('inquiry')} type="button">
              Ask a question
            </button>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <nav>
            <button onClick={() => onNavigate('inquiry')} type="button">
              Send a message
            </button>
            <button onClick={() => onNavigate('inquiry')} type="button">
              @theborrowboutique
            </button>
            <button onClick={() => onNavigate('faq')} type="button">
              Rental policies
            </button>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 The Borrow Boutique. All rights reserved.</p>
        <p>Sustainable fashion rental · Sydney, Australia</p>
      </div>
    </footer>
  )
}
