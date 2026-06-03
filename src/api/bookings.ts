import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/firebaseConfig'

type FormPayload = Record<string, string>

function toPayload(data: FormData) {
  return Object.fromEntries(
    Array.from(data.entries()).map(([key, value]) => [key, String(value)]),
  ) as FormPayload
}

export function formDataToPayload(form: HTMLFormElement) {
  return toPayload(new FormData(form))
}

export async function createInquiry(payload: FormPayload) {
  const submitInquiry = httpsCallable<FormPayload, { id: string }>(functions, 'submitInquiry')
  return submitInquiry(payload)
}

export async function createTryOnBooking(payload: FormPayload) {
  const submitTryOnBooking = httpsCallable<FormPayload, { id: string }>(functions, 'submitTryOnBooking')
  return submitTryOnBooking(payload)
}

export async function createRentalRequest(payload: FormPayload) {
  const submitRentalRequest = httpsCallable<FormPayload, { checkoutUrl?: string | null; id: string }>(
    functions,
    'submitRentalRequest',
  )
  return submitRentalRequest(payload)
}
