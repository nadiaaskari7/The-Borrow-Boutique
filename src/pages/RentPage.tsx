import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Dress } from '../types'
import { DressImage } from '../components/DressImage'
import { CustomerFields, FormPanel } from '../components/Forms'
import { money } from '../utils/dresses'

const SHIPPING_FEE = 15

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getAutomaticReturnDate(rentalStart: string) {
  if (!rentalStart) return ''

  const date = new Date(`${rentalStart}T00:00:00`)
  const day = date.getDay()
  const daysToAdd = day >= 1 && day <= 4 ? 1 : (8 - day) % 7 || 1
  date.setDate(date.getDate() + daysToAdd)

  return formatDateInputValue(date)
}

export function RentPage({
  onSizeChange,
  selectedDress,
  selectedSize,
  onSubmit,
}: {
  onSizeChange: (size: string) => void
  selectedDress?: Dress
  selectedSize: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const [deliveryMethod, setDeliveryMethod] = useState<'Post' | 'Pick up'>('Post')
  const [rentalStart, setRentalStart] = useState('')

  if (!selectedDress) {
    return (
      <main className="page-layout">
        <p className="empty-state">Choose a dress before starting a rental request.</p>
      </main>
    )
  }

  const shippingFee = deliveryMethod === 'Post' ? SHIPPING_FEE : 0
  const returnDate = getAutomaticReturnDate(rentalStart)
  const total = selectedDress.rentalPrice + shippingFee

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
              <dt>Shipping</dt>
              <dd>{shippingFee ? money(shippingFee) : 'Pick up'}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{selectedSize || selectedDress.sizes[0]}</dd>
            </div>
            <div>
              <dt>Total due</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
        </div>
      </section>
      <FormPanel onSubmit={onSubmit} submitLabel="Book rental">
        <CustomerFields />
        <label>
          Event date
          <input name="eventDate" type="date" required />
        </label>
        <label>
          Rental start
          <input
            name="rentalStart"
            onChange={(event) => setRentalStart(event.target.value)}
            type="date"
            value={rentalStart}
            required
          />
        </label>
        <label>
          Return date set automatically
          <input className="calculated-field" readOnly type="date" value={returnDate} />
        </label>
        <label className="wide">
          Size to rent
          <select
            name="rentalSize"
            onChange={(event) => onSizeChange(event.target.value)}
            value={selectedSize || selectedDress.sizes[0]}
            required
          >
            {selectedDress.sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <input name="returnDate" type="hidden" value={returnDate} />
        <input name="shippingFee" type="hidden" value={shippingFee} />
        <input name="totalDue" type="hidden" value={total} />
        <label className="wide">
          Delivery method
          <select
            name="deliveryMethod"
            onChange={(event) => setDeliveryMethod(event.target.value as 'Post' | 'Pick up')}
            value={deliveryMethod}
            required
          >
            <option value="Post">Post - $15 shipping fee</option>
            <option value="Pick up">Pick up - no shipping fee</option>
          </select>
        </label>
        <label className="wide">
          Delivery or pickup notes
          <textarea name="deliveryNotes" rows={4} placeholder="Pickup, courier address, or timing notes." />
        </label>
        <p className="payment-note">
          Weekday rentals, Monday to Thursday, are returned the following day. Weekend rentals,
          Friday to Sunday, are returned or posted back with the provided return bag on Monday.
        </p>
      </FormPanel>
    </main>
  )
}
