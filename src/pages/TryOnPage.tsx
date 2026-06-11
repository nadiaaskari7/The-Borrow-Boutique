import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Dress } from '../types'
import { createTryOnBooking, formDataToPayload } from '../api/bookings'
import { CustomSelect } from '../components/CustomSelect'
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
  onNotice,
}: {
  dresses: Dress[]
  onNotice: (message: string) => void
}) {
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('dress') ?? undefined
  const selectedDress = dresses.find((d) => d.id === preselectedId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    const data = formDataToPayload(form)
    const tryOnDress = dresses.find((dress) => dress.id === data.dressId)

    await createTryOnBooking({
      ...data,
      dressName: tryOnDress?.name ?? '',
    })

    form.reset()
    onNotice('Try-on request sent. We will confirm the time before it is locked in.')
  }

  return (
    <main className="form-page">
      <PageHeading eyebrow="Appointment" title="Book a try-on">
        Request a time to visit, try your favourites, and confirm the best fit.
      </PageHeading>
      <FormPanel onSubmit={handleSubmit} submitLabel="Request try-on">
        <CustomerFields />
        <label>
          Preferred date
          <input name="preferredDate" type="date" required />
        </label>
        <label>
          Preferred time
          <CustomSelect
            name="preferredTime"
            options={[{ label: 'Select a time', value: '' }, ...TIME_SLOTS]}
            required
          />
        </label>
        <label>
          Dress to try
          <CustomSelect
            defaultValue={selectedDress?.id}
            name="dressId"
            searchable
            options={dresses.map((dress) => ({
              label: `${dress.name} - ${dress.sizes.join(' / ')}`,
              value: dress.id,
            }))}
          />
        </label>
        <label className="wide">
          Notes
          <textarea name="notes" rows={4} placeholder="Event date, styles you like, or sizing notes." />
        </label>
      </FormPanel>
    </main>
  )
}
