import type { FormEvent } from 'react'
import type { Dress } from '../types'
import { CustomerFields, FormPanel } from '../components/Forms'
import { PageHeading } from '../components/PageHeading'

function generateTimeSlots() {
  const slots = []
  for (let hour = 10; hour < 18; hour++) {
    for (const minute of [0, 30]) {
      const h = hour % 12 === 0 ? 12 : hour % 12
      const ampm = hour < 12 ? 'am' : 'pm'
      const label = `${h}:${minute === 0 ? '00' : '30'} ${ampm}`
      const value = `${String(hour).padStart(2, '0')}:${minute === 0 ? '00' : '30'}`
      slots.push({ label, value })
    }
  }
  slots.push({ label: '6:00 pm', value: '18:00' })
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function TryOnPage({
  dresses,
  selectedDress,
  onSubmit,
}: {
  dresses: Dress[]
  selectedDress?: Dress
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <main className="form-page">
      <PageHeading eyebrow="Appointment" title="Book a try-on">
        Request a time to visit, try your favourites, and confirm the best fit.
      </PageHeading>
      <FormPanel onSubmit={onSubmit} submitLabel="Request try-on">
        <CustomerFields />
        <label>
          Preferred date
          <input name="preferredDate" type="date" required />
        </label>
        <label>
          Preferred time
          <select name="preferredTime" required>
            <option value="">Select a time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dress to try
          <select name="dressId" defaultValue={selectedDress?.id}>
            {dresses.map((dress) => (
              <option key={dress.id} value={dress.id}>
                {dress.name} - {dress.sizes.join(' / ')}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          Notes
          <textarea name="notes" rows={4} placeholder="Event date, styles you like, or sizing notes." />
        </label>
      </FormPanel>
    </main>
  )
}
