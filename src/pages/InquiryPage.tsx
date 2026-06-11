import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Dress } from '../types'
import { createInquiry, formDataToPayload } from '../api/bookings'
import { CustomSelect } from '../components/CustomSelect'
import { CustomerFields, FormPanel } from '../components/Forms'
import { PageHeading } from '../components/PageHeading'

export function InquiryPage({
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
    event.preventDefault()
    const form = event.currentTarget
    const data = formDataToPayload(form)
    const inquiryDress = dresses.find((dress) => dress.id === data.dressId)

    await createInquiry({
      ...data,
      dressName: inquiryDress?.name ?? '',
    })

    form.reset()
    onNotice('Inquiry sent. We will reply as soon as possible.')
  }

  return (
    <main className="form-page">
      <PageHeading eyebrow="Questions" title="Ask about a dress">
        Send a fit, date, pickup, or styling question before you book.
      </PageHeading>
      <FormPanel onSubmit={handleSubmit} submitLabel="Send inquiry">
        <CustomerFields />
        <label>
          Dress
          <CustomSelect
            defaultValue={selectedDress?.id}
            name="dressId"
            options={dresses.map((dress) => ({
              label: `${dress.name} - ${dress.sizes.join(' / ')}`,
              value: dress.id,
            }))}
          />
        </label>
        <label className="wide">
          Message
          <textarea name="message" rows={5} required placeholder="Ask about fit, dates, pickup, or styling." />
        </label>
      </FormPanel>
    </main>
  )
}
