import type { FormEvent } from 'react'
import type { Dress } from '../types'
import { CustomerFields, FormPanel } from '../components/Forms'
import { PageHeading } from '../components/PageHeading'

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
          <input name="preferredTime" type="time" required />
        </label>
        <label>
          Dress to try
          <select name="dressId" defaultValue={selectedDress?.id}>
            {dresses.map((dress) => (
              <option key={dress.id} value={dress.id}>
                {dress.name} - {dress.size}
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
