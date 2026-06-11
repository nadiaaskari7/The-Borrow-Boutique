import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

export function FormPanel({
  children,
  disabled,
  onSubmit,
  submitLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  submitLabel: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(event)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      {children}
      <button className="wide" disabled={disabled || isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            <span>Sending…</span>
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  )
}

export function CustomerFields() {
  return (
    <>
      <label>
        Name
        <input name="customerName" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" autoComplete="tel" required />
      </label>
    </>
  )
}
