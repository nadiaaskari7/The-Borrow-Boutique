import { PageHeading } from '../components/PageHeading'
import type { Page } from '../types'

export function HowItWorksPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="info-page">
      <PageHeading eyebrow="Renting made simple" title="How it works">
        Choose your dress, confirm your dates, wear it to your event, then return it on time.
      </PageHeading>

      <section className="process-grid">
        <article>
          <span>01</span>
          <h2>Browse the wardrobe</h2>
          <p>Filter by size, brand, colour, type, and budget. Open each dress to view close-up images.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Book a try-on</h2>
          <p>Request a try-on time if you want to check fit before committing to your rental.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Request your rental</h2>
          <p>Send your rental dates and contact details. Payment links can be used once configured.</p>
        </article>
        <article>
          <span>04</span>
          <h2>Return after wear</h2>
          <p>Return the dress by the agreed date. Cleaning and bond terms can be confirmed per booking.</p>
        </article>
      </section>

      <div className="info-actions">
        <button onClick={() => onNavigate('dresses')} type="button">
          Browse dresses
        </button>
        <button className="secondary" onClick={() => onNavigate('try-on')} type="button">
          Book a try-on
        </button>
      </div>
    </main>
  )
}
