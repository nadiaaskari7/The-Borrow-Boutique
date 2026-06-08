import type { FormEvent, ReactNode } from 'react'

export function FormPanel({
  children,
  disabled,
  onSubmit,
  submitLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: string
}) {
  return (
    <form className="form-panel" onSubmit={onSubmit}>
      {children}
      <button className="wide" disabled={disabled} type="submit">
        {submitLabel}
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
