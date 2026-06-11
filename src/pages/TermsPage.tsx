import { useNavigate } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'

const terms: { title: string; points: string[] }[] = [
  {
    title: 'Cancellations & Refunds',
    points: [
      'Cancel at least 7 days before your pick-up or postage date for a full refund.',
      'Cancellations made within a week of the event may receive a partial refund.',
      'No refunds for change of mind or sizing issues — try-ons are available before renting!',
    ],
  },
  {
    title: 'Care & Returns',
    points: [
      'Please do not wash or attempt to clean any garments.',
      'Notify us immediately if your dress is damaged.',
      'Damage fees may apply depending on severity.',
      'If the item is damaged beyond repair, you\'ll be required to pay the full retail price.',
    ],
  },
  {
    title: 'Late Fees',
    points: [
      'Please return your rental on time as other customers may be waiting!',
      'Late returns incur a $10 per day fee.',
      'Weekend rentals (Fri–Sun) must be returned by Monday night.',
      'Weekday rentals must be returned the next day.',
      'DM us if you need an extension — we\'re happy to arrange something if possible.',
    ],
  },
  {
    title: 'Payments & Try-Ons',
    points: [
      'Rentals are only confirmed once payment is received (send proof of bank transfer).',
      'The price for postage will depend on various factors — we will let you know the price via DM.',
      'Try-ons available! DM us to arrange a time and we\'ll send the address.',
      'Pick-up times are arranged via DM for your convenience.',
    ],
  },
  {
    title: 'General Info',
    points: [
      'Our dresses may show minor general wear & tear — this is normal for rentals.',
      'If you have any concerns about the quality, please contact us ASAP so we can make it right!',
    ],
  },
]

export function TermsPage() {
  const navigate = useNavigate()

  return (
    <main className="info-page">
      <PageHeading eyebrow="Rental policy" title="Terms and Conditions">
        Please read these terms before booking a dress rental.
      </PageHeading>

      <section className="process-grid terms-grid">
        {terms.map((term) => (
          <article key={term.title}>
            <h2>{term.title}</h2>
            <ul>
              {term.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <p className="terms-agreement">By renting with us you agree to these terms and conditions.</p>

      <div className="info-actions">
        <button onClick={() => navigate('/dresses')} type="button">
          Browse dresses
        </button>
        <button className="secondary" onClick={() => navigate('/faq')} type="button">
          Read FAQ
        </button>
      </div>
    </main>
  )
}
