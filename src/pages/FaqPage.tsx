import { PageHeading } from '../components/PageHeading'
import type { Page } from '../types'

const faqs = [
  {
    question: 'How long is a rental?',
    answer:
      'Rental length is confirmed with each booking. Add your event date, rental start, and return date when you request a dress.',
  },
  {
    question: 'Can I try a dress on first?',
    answer:
      'Yes. Use the try-on form to request a preferred date and time, plus any sizing notes for the dresses you want to try.',
  },
  {
    question: 'How do payments work?',
    answer:
      'The app saves rental requests now. Once payment links are added to dresses, customers can open the secure payment page during checkout.',
  },
  {
    question: 'What if a dress has multiple sizes?',
    answer:
      'Dresses with multiple Firebase sizes appear under every matching size filter, so one listing can show for S and M.',
  },
  {
    question: 'Do I need to clean the dress?',
    answer:
      'Cleaning terms should be confirmed in your rental policy. Most rental boutiques include standard cleaning in the rental process.',
  },
]

export function FaqPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="info-page">
      <PageHeading eyebrow="Details before you book" title="FAQ">
        Common questions about try-ons, renting, payment, sizing, and returns.
      </PageHeading>

      <section className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </section>

      <div className="info-actions">
        <button onClick={() => onNavigate('dresses')} type="button">
          Browse dresses
        </button>
        <button className="secondary" onClick={() => onNavigate('inquiry')} type="button">
          Ask a question
        </button>
      </div>
    </main>
  )
}
