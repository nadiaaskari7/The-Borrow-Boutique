import { useNavigate } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'

const faqs = [
  {
    question: 'How long is a rental?',
    answer:
      'The return date is set automatically from your rental start date. Weekday rentals, Monday to Thursday, are returned the following day or posted back with the return bag provided. Weekend rentals, Friday to Sunday, are returned or posted back on Monday.',
  },
  {
    question: 'Can I try a dress on first?',
    answer:
      'Yes. Use the try-on form to request a preferred date and time, plus any sizing notes for the dresses you want to try.',
  },
  {
    question: 'Do I need to clean the dress?',
    answer:
      'No. Please do NOT clean the dress. Cleaning is handled by The Borrow Boutique after the dress is returned.',
  },
]

export function FaqPage() {
  const navigate = useNavigate()

  return (
    <main className="info-page">
      <PageHeading eyebrow="Details before you book" title="FAQ">
        Common questions about try-ons, renting, cleaning, and returns.
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
        <button onClick={() => navigate('/dresses')} type="button">
          Browse dresses
        </button>
        <button className="secondary" onClick={() => navigate('/inquiry')} type="button">
          Ask a question
        </button>
      </div>
    </main>
  )
}
