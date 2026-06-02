import type { FormEvent } from 'react'
import type { Dress } from '../types'
import { CustomerFields, FormPanel } from '../components/Forms'
import { PageHeading } from '../components/PageHeading'

export function InquiryPage({
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
      <PageHeading eyebrow="Questions" title="Ask about a dress">
        Send a fit, date, pickup, or styling question before you book.
      </PageHeading>
      <FormPanel onSubmit={onSubmit} submitLabel="Send inquiry">
        <CustomerFields />
        <label>
          Dress
          <select name="dressId" defaultValue={selectedDress?.id}>
            {dresses.map((dress) => (
              <option key={dress.id} value={dress.id}>
                {dress.name} - {dress.sizes.join(' / ')}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          Message
          <textarea name="message" rows={5} required placeholder="Ask about fit, dates, pickup, or styling." />
        </label>
      </FormPanel>
    </main>
  )
}
