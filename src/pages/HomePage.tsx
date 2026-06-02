import type { Dress, Page } from '../types'
import { boutiqueSizes } from '../utils/dresses'
import { DressImage } from '../components/DressImage'
import { DressGrid } from '../components/DressGrid'

export function HomePage({
  dresses,
  onNavigate,
  onAsk,
  onRent,
}: {
  dresses: Dress[]
  onNavigate: (page: Page) => void
  onAsk: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  const featured = dresses.slice(0, 4)

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Designer looks without the full-price commitment</p>
          <h1>Borrow the dress. Own the moment.</h1>
          <p>
            A curated rental wardrobe for birthdays, races, weddings, formals, and every last-minute
            weekend plan.
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
        <DressImage className="hero-dress" dress={dresses[0]} />
      </section>

      <section className="size-strip" aria-label="Available dress sizes">
        {boutiqueSizes.map((size) => (
          <button key={size} onClick={() => onNavigate('dresses')} type="button">
            {size}
          </button>
        ))}
      </section>

      <section className="section-block">
        <div className="section-title">
          <p className="eyebrow">New in</p>
          <h2>Ready for your next event</h2>
        </div>
        <DressGrid dresses={featured} onAsk={onAsk} onRent={onRent} />
      </section>
    </main>
  )
}
