import type { Dress, Page } from '../types'
import { DressImage } from '../components/DressImage'
import { DressGrid } from '../components/DressGrid'

const testimonials = [
  {
    quote:
      "Wore the most stunning gown to my sister's wedding. The try-on booking made finding the right size so easy.",
    author: 'Sophie M., Auckland',
  },
  {
    quote:
      'I tried on three dresses and found the perfect one in 20 minutes. Total lifesaver for a last-minute event!',
    author: 'Jade K., Wellington',
  },
  {
    quote:
      'I rent from here every season. The collection is always fresh and each dress arrives beautifully packaged.',
    author: 'Mia L., Christchurch',
  },
]

export function HomePage({
  dresses,
  onNavigate,
  onOpen,
}: {
  dresses: Dress[]
  onNavigate: (page: Page) => void
  onOpen: (dressId: string) => void
}) {
  const featured = dresses.filter((dress) => dress.isNew).slice(0, 4)
  const displayDresses = featured.length ? featured : dresses.slice(0, 4)
  const heroDress =
    dresses.find((dress) => {
      const name = dress.name.toLowerCase()
      return name.includes('valerie') && name.includes('corset')
    }) ??
    dresses.find((dress) => dress.name.toLowerCase().includes('valerie')) ??
    dresses[0]

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Auckland-based dress rental, available New Zealand-wide
          </div>
          <p className="eyebrow">Designer looks, rental prices</p>
          <h1>
            Borrow the dress.
            <br />
            Own the moment.
          </h1>
          <p>
            A curated rental wardrobe for birthdays, races, weddings, formals, and every
            last-minute weekend plan.
          </p>
          <div className="hero-actions">
            <button onClick={() => onNavigate('dresses')} type="button">
              Shop dresses
            </button>
            <button className="secondary" onClick={() => onNavigate('try-on')} type="button">
              Book a try-on
            </button>
          </div>
        </div>
        <DressImage className="hero-dress" dress={heroDress} />
      </section>

      {/* Value propositions */}
      <div className="value-props">
        <div className="value-prop">
          <div className="value-prop-icon">✦</div>
          <h3>Try before you commit</h3>
          <p>Book a free in-person try-on session to find your perfect fit before renting.</p>
        </div>
        <div className="value-prop">
          <div className="value-prop-icon">◈</div>
          <h3>Designer labels for less</h3>
          <p>Wear premium brands at a fraction of the retail price — rentals from $35.</p>
        </div>
        <div className="value-prop">
          <div className="value-prop-icon">↺</div>
          <h3>Wear it, return it, repeat</h3>
          <p>No wardrobe clutter. Dress beautifully for every event, sustainably.</p>
        </div>
      </div>

      {/* New in */}
      <section className="section-block">
        <div className="section-title">
          <p className="eyebrow">New in</p>
          <h2>Ready for your next event</h2>
        </div>
        <DressGrid
          dresses={displayDresses}
          emptyMessage="New dresses coming soon — check back shortly."
          onOpen={onOpen}
        />
        <div style={{ marginTop: '28px' }}>
          <button className="secondary" onClick={() => onNavigate('dresses')} type="button">
            View full collection
          </button>
        </div>
      </section>

      {/* How it works preview */}
      <section className="how-it-works-preview">
        <div className="section-title">
          <p className="eyebrow">Simple process</p>
          <h2>How it works</h2>
        </div>
        <div className="hiw-steps">
          <div className="hiw-step">
            <span className="hiw-step-num">01</span>
            <h3>Browse the wardrobe</h3>
            <p>Filter by size, brand, colour, and budget. Open any dress to see all images and details.</p>
          </div>
          <div className="hiw-step">
            <span className="hiw-step-num">02</span>
            <h3>Book a try-on</h3>
            <p>Request a try-on appointment to confirm fit and style before committing to your rental.</p>
          </div>
          <div className="hiw-step">
            <span className="hiw-step-num">03</span>
            <h3>Book rental</h3>
            <p>Submit your rental start date and delivery method. We'll confirm your booking before anything is locked in.</p>
          </div>
          <div className="hiw-step">
            <span className="hiw-step-num">04</span>
            <h3>Wear, then return</h3>
            <p>Return the dress on the automatic return date. Please do not clean it; cleaning is handled after return.</p>
          </div>
        </div>
        <div className="how-it-works-actions">
          <button onClick={() => onNavigate('try-on')} type="button">
            Book a try-on
          </button>
          <button className="secondary" onClick={() => onNavigate('how-it-works')} type="button">
            Learn more
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-title">
          <p className="eyebrow">What our renters say</p>
          <h2>Loved by renters across New Zealand</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((t) => (
            <div className="testimonial-card" key={t.author}>
              <blockquote>"{t.quote}"</blockquote>
              <p className="testimonial-author">— {t.author}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
