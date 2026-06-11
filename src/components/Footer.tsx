import { useNavigate } from 'react-router-dom'

export function Footer() {
  const navigate = useNavigate()

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
            <button onClick={() => navigate('/dresses')} type="button">
              Browse dresses
            </button>
            <button onClick={() => navigate('/how-it-works')} type="button">
              How it works
            </button>
            <button onClick={() => navigate('/gallery')} type="button">
              Gallery
            </button>
            <button onClick={() => navigate('/faq')} type="button">
              FAQ
            </button>
            <button onClick={() => navigate('/terms')} type="button">
              Terms
            </button>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Book</h4>
          <nav>
            <button onClick={() => navigate('/try-on')} type="button">
              Book a try-on
            </button>
            <button onClick={() => navigate('/dresses')} type="button">
              Book rental
            </button>
            <button onClick={() => navigate('/inquiry')} type="button">
              Ask a question
            </button>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <nav>
            <button onClick={() => navigate('/inquiry')} type="button">
              Send a message
            </button>
            <button
              onClick={() =>
                window.open('https://www.instagram.com/theborrowboutique.nz', '_blank', 'noopener,noreferrer')
              }
              type="button"
            >
              @theborrowboutique.nz
            </button>
            <button onClick={() => navigate('/terms')} type="button">
              Rental policies
            </button>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p>(c) 2026 The Borrow Boutique. All rights reserved.</p>
        <p>Auckland-based dress rental. Available New Zealand-wide.</p>
      </div>
    </footer>
  )
}
