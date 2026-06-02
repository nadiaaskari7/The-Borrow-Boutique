import { PageHeading } from '../components/PageHeading'
import type { Page } from '../types'

const steps = [
  {
    num: '01',
    title: 'Browse the wardrobe',
    body: 'Filter by size, brand, colour, type, and budget. Open each dress to view close-up images and full rental details.',
  },
  {
    num: '02',
    title: 'Book a try-on',
    body: 'Request a try-on appointment if you want to check fit and style before committing to your rental.',
  },
  {
    num: '03',
    title: 'Request your rental',
    body: 'Send your rental dates and contact details. We confirm your booking before anything is locked in.',
  },
  {
    num: '04',
    title: 'Wear, then return',
    body: 'Return the dress by the agreed date. Cleaning and bond terms are confirmed per booking.',
  },
]

export function HowItWorksPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="info-page">
      <PageHeading eyebrow="Renting made simple" title="How it works">
        Choose your dress, confirm your dates, wear it to your event, then return it on time.
      </PageHeading>

      <section className="process-grid">
        {steps.map((step) => (
          <article key={step.num}>
            <span className="process-step-num">{step.num}</span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
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
