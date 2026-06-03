import { PageHeading } from '../components/PageHeading'
import type { Page } from '../types'

const terms = [
  {
    title: 'Bookings',
    body: 'A rental is confirmed once The Borrow Boutique accepts your booking request. Please check your event date, rental start date, delivery method, and contact details before submitting.',
  },
  {
    title: 'Rental Length and Returns',
    body: 'Return dates are set automatically. Weekday rentals, Monday to Thursday, must be returned the following day or posted back using the return bag provided. Weekend rentals, Friday to Sunday, must be returned or posted back on Monday.',
  },
  {
    title: 'Shipping',
    body: 'Pick up is free. Posted rentals include a $15 shipping fee, which is added to the total at booking.',
  },
  {
    title: 'Cleaning',
    body: 'Do not clean the dress. Cleaning is handled by The Borrow Boutique after return. Please return the dress in its worn condition and let us know about any marks or damage.',
  },
  {
    title: 'Care and Damage',
    body: 'You are responsible for taking reasonable care of the dress while it is with you. Lost items, late returns, significant damage, or unreturned dresses may result in additional charges.',
  },
  {
    title: 'Cancellations',
    body: 'If you need to change or cancel a rental, contact The Borrow Boutique as soon as possible so the booking can be reviewed before the rental date.',
  },
]

export function TermsPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="info-page">
      <PageHeading eyebrow="Rental policy" title="Terms and Conditions">
        Please read these terms before booking a dress rental.
      </PageHeading>

      <section className="process-grid terms-grid">
        {terms.map((term) => (
          <article key={term.title}>
            <h2>{term.title}</h2>
            <p>{term.body}</p>
          </article>
        ))}
      </section>

      <div className="info-actions">
        <button onClick={() => onNavigate('dresses')} type="button">
          Browse dresses
        </button>
        <button className="secondary" onClick={() => onNavigate('faq')} type="button">
          Read FAQ
        </button>
      </div>
    </main>
  )
}
