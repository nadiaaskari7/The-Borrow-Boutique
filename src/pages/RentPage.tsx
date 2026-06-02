import type { FormEvent } from 'react'
import type { Dress } from '../types'
import { DressImage } from '../components/DressImage'
import { CustomerFields, FormPanel } from '../components/Forms'
import { money } from '../utils/dresses'

export function RentPage({
  selectedDress,
  onSubmit,
}: {
  selectedDress?: Dress
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!selectedDress) {
    return (
      <main className="page-layout">
        <p className="empty-state">Choose a dress before starting a rental request.</p>
      </main>
    )
  }

  const total = selectedDress.rentalPrice + (selectedDress.bond ?? 0)

  return (
    <main className="checkout-layout">
      <section className="checkout-summary">
        <DressImage dress={selectedDress} />
        <div>
          <p className="eyebrow">Rental request</p>
          <h1>{selectedDress.name}</h1>
          <p>
            {selectedDress.brand ?? selectedDress.designer ?? 'The Borrow Boutique'} / Sizes{' '}
            {selectedDress.sizes.join(' / ')}
          </p>
          <dl>
            <div>
              <dt>Rental</dt>
              <dd>{money(selectedDress.rentalPrice)}</dd>
            </div>
            <div>
              <dt>Bond</dt>
              <dd>{money(selectedDress.bond ?? 0)}</dd>
            </div>
            <div>
              <dt>Total due</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
        </div>
      </section>
      <FormPanel onSubmit={onSubmit} submitLabel="Request rental">
        <CustomerFields />
        <label>
          Event date
          <input name="eventDate" type="date" required />
        </label>
        <label>
          Rental start
          <input name="rentalStart" type="date" required />
        </label>
        <label>
          Return date
          <input name="returnDate" type="date" required />
        </label>
        <label className="wide">
          Delivery or pickup notes
          <textarea name="deliveryNotes" rows={4} placeholder="Pickup, courier address, or timing notes." />
        </label>
        <p className="payment-note">
          Stripe payment links can be attached per dress. Requests without a link are saved as
          payment pending.
        </p>
      </FormPanel>
    </main>
  )
}
