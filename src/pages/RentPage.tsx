import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { FormEvent } from 'react'
import type { DeliveryMethod, Dress } from '../types'
import { createRentalRequest, formDataToPayload } from '../api/bookings'
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

function addDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return formatDateInputValue(date)
}

function getAutomaticReturnDate(rentalStart: string) {
  if (!rentalStart) return ''
  const date = new Date(`${rentalStart}T00:00:00`)
  const day = date.getDay()
  const daysToAdd = day >= 1 && day <= 4 ? 1 : (8 - day) % 7 || 1
  date.setDate(date.getDate() + daysToAdd)
  return formatDateInputValue(date)
}

function isDateUnavailable(date: Date, bookedDates: string[]) {
  if (!bookedDates.length) return false
  const bookedSet = new Set(bookedDates)
  const dateStr = formatDateInputValue(date)
  const returnDate = getAutomaticReturnDate(dateStr)
  const checkStart = addDays(dateStr, -1)
  const current = new Date(`${checkStart}T00:00:00`)
  const end = new Date(`${returnDate}T00:00:00`)
  while (current <= end) {
    if (bookedSet.has(formatDateInputValue(current))) return true
    current.setDate(current.getDate() + 1)
  }
  return false
}

export function RentPage({
  dresses,
  onNotice,
}: {
  dresses: Dress[]
  onNotice: (message: string) => void
}) {
  const { dressId } = useParams<{ dressId: string }>()
  const selectedDress = dresses.find((d) => d.id === dressId)

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Post')
  const [selectedSize, setSelectedSize] = useState<string>(selectedDress?.sizes[0] ?? '')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  if (!selectedDress) {
    return (
      <main className="page-layout">
        <p className="empty-state">Choose a dress before starting a rental request.</p>
      </main>
    )
  }

  const bookedDates = selectedDress.bookedDates ?? []
  const rentalStart = selectedDate ? formatDateInputValue(selectedDate) : ''
  const returnDate = getAutomaticReturnDate(rentalStart)
  const shippingFee = deliveryMethod === 'Post' ? SHIPPING_FEE : 0
  const total = selectedDress.rentalPrice + shippingFee
  const currentSize = selectedSize || selectedDress.sizes[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = formDataToPayload(form)

    const result = await createRentalRequest({
      ...data,
      dressId: selectedDress.id,
      dressName: selectedDress.name,
      size: currentSize,
      sizes: selectedDress.sizes.join(', '),
      rawSize: selectedDress.rawSize ?? '',
      rawSizes: selectedDress.rawSizes?.join(', ') ?? '',
      rentalPrice: String(selectedDress.rentalPrice),
      paymentLink: selectedDress.paymentLink ?? '',
    })

    if (result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl
    } else {
      onNotice('Rental request sent. We will confirm availability and payment details.')
    }

    form.reset()
  }

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
              <dd>{currentSize}</dd>
            </div>
            <div>
              <dt>Total due</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
        </div>
      </section>
      <FormPanel onSubmit={handleSubmit} submitLabel="Book rental" disabled={!rentalStart}>
        <CustomerFields />
        <div className="calendar-field">
          <span className="calendar-label">Rental start date</span>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={[{ before: today }, (date: Date) => isDateUnavailable(date, bookedDates)]}
            classNames={{ root: 'rdp-root' }}
          />
          <input name="rentalStart" type="hidden" value={rentalStart} required />
        </div>
        <label>
          Return date set automatically
          <input className="calculated-field" readOnly type="date" value={returnDate} />
        </label>
        <label className="wide">
          Size to rent
          <select
            name="rentalSize"
            onChange={(event) => setSelectedSize(event.target.value)}
            value={currentSize}
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
            onChange={(event) => setDeliveryMethod(event.target.value as DeliveryMethod)}
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
