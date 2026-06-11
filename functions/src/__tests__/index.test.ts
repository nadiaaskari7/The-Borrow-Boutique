import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mock objects — must be created before vi.mock() factories run
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  // --- Firestore doc refs ---
  const inquiryDocRef = { id: 'inquiry_id_1', update: vi.fn().mockResolvedValue(undefined) }
  const tryOnDocRef = { id: 'tryon_id_1', update: vi.fn().mockResolvedValue(undefined) }
  const rentalDocRef = { id: 'rental_id_1', update: vi.fn().mockResolvedValue(undefined) }
  const mailDocRef = { id: 'mail_id_1' }

  // rental snapshot returned by .doc(id).get()
  const rentalSnapshot = {
    data: vi.fn(),
  }
  const rentalDocForGet = {
    get: vi.fn().mockResolvedValue(rentalSnapshot),
    update: vi.fn().mockResolvedValue(undefined),
  }
  const dressDocForUpdate = {
    update: vi.fn().mockResolvedValue(undefined),
  }

  // per-collection add/doc mocks
  const mailAdd = vi.fn().mockResolvedValue(mailDocRef)
  const inquiriesAdd = vi.fn().mockResolvedValue(inquiryDocRef)
  const tryOnAdd = vi.fn().mockResolvedValue(tryOnDocRef)
  const rentalAdd = vi.fn().mockResolvedValue(rentalDocRef)
  const rentalDoc = vi.fn().mockReturnValue(rentalDocForGet)
  const dressDoc = vi.fn().mockReturnValue(dressDocForUpdate)

  const mockCollection = vi.fn((name: string) => {
    switch (name) {
      case 'mail': return { add: mailAdd }
      case 'inquiries': return { add: inquiriesAdd }
      case 'tryOnBookings': return { add: tryOnAdd }
      case 'rentalRequests': return { add: rentalAdd, doc: rentalDoc }
      case 'Dresses': return { doc: dressDoc }
      default: return { add: vi.fn(), doc: vi.fn() }
    }
  })

  const mockDb = { collection: mockCollection }

  // --- Stripe ---
  const mockCheckoutCreate = vi.fn().mockResolvedValue({
    id: 'cs_test_abc123',
    url: 'https://checkout.stripe.com/pay/cs_test_abc123',
  })
  const mockConstructEvent = vi.fn()
  // Must use a regular function (not arrow) so `new Stripe()` works as a constructor
  const MockStripe = vi.fn(function MockStripe(this: Record<string, unknown>) {
    this.checkout = { sessions: { create: mockCheckoutCreate } }
    this.webhooks = { constructEvent: mockConstructEvent }
  })

  return {
    mockDb,
    mockCollection,
    inquiryDocRef,
    tryOnDocRef,
    rentalDocRef,
    rentalSnapshot,
    rentalDocForGet,
    dressDocForUpdate,
    mailAdd,
    inquiriesAdd,
    tryOnAdd,
    rentalAdd,
    rentalDoc,
    dressDoc,
    mockCheckoutCreate,
    mockConstructEvent,
    MockStripe,
  }
})

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn() }))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mocks.mockDb),
  FieldValue: {
    serverTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
    arrayUnion: vi.fn((...args: string[]) => ({ _type: 'arrayUnion', values: args })),
  },
}))

vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn(() => ({ value: () => 'sk_test_fake' })),
}))

vi.mock('firebase-functions/v2/https', async () => {
  class HttpsError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
      this.name = 'HttpsError'
    }
  }
  return {
    // Return the handler directly so exports ARE the handler functions
    onCall: vi.fn((_opts: unknown, handler: unknown) => handler),
    onRequest: vi.fn((_opts: unknown, handler: unknown) => handler),
    HttpsError,
  }
})

vi.mock('stripe', () => ({ default: mocks.MockStripe }))

// ---------------------------------------------------------------------------
// Import after mocks are in place
// ---------------------------------------------------------------------------
// eslint-disable-next-line import/first
import { submitInquiry, submitTryOnBooking, submitRentalRequest, stripeWebhook } from '../index'

// Cast to callable handler signatures (onCall mock strips the CloudFunction wrapper)
type InquiryHandler = (req: { data: Record<string, unknown> }) => Promise<{ id: string }>
type TryOnHandler = (req: { data: Record<string, unknown> }) => Promise<{ id: string }>
type RentalHandler = (req: {
  data: Record<string, unknown>
  rawRequest: { headers: Record<string, string | undefined> }
}) => Promise<{ id: string; checkoutUrl: string | null | undefined }>
type WebhookHandler = (
  req: {
    headers: Record<string, string | undefined>
    rawBody: Buffer
  },
  res: {
    status: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  },
) => Promise<void>

const inquiry = submitInquiry as unknown as InquiryHandler
const tryOn = submitTryOnBooking as unknown as TryOnHandler
const rental = submitRentalRequest as unknown as RentalHandler
const webhook = stripeWebhook as unknown as WebhookHandler

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const validInquiryData = {
  customerName: 'Sophie Chen',
  email: 'sophie@example.com',
  phone: '021 555 1234',
  message: 'Do you have this in a size 8?',
  dressId: 'dress_abc',
  dressName: 'Satin Cowl Midi',
}

const validTryOnData = {
  customerName: 'Jade Kim',
  email: 'jade@example.com',
  phone: '027 999 8765',
  preferredDate: '2026-08-15',
  preferredTime: '11:00',
  dressId: 'dress_xyz',
  dressName: 'Black Tie Gown',
  notes: 'I have a wedding on the 17th.',
}

const validRentalData = {
  customerName: 'Mia Tran',
  email: 'mia@example.com',
  phone: '09 123 4567',
  dressId: 'dress_123',
  dressName: 'Evening Gown',
  size: 'S',
  rentalStart: '2026-09-01',
  returnDate: '2026-09-02',
  rentalPrice: '120',
  shippingFee: '15',
  totalDue: '135',
  deliveryMethod: 'Post',
}

const mockRentalRequest = (data: Record<string, unknown> = validRentalData) => ({
  data,
  rawRequest: { headers: { origin: 'https://theborrowboutique.nz' } },
})

function makeWebhookRequest(overrides: Partial<{ headers: Record<string, string | undefined>; rawBody: Buffer }> = {}) {
  return {
    headers: overrides.headers ?? { 'stripe-signature': 'valid_sig' },
    rawBody: overrides.rawBody ?? Buffer.from('{}'),
  }
}

function makeWebhookResponse() {
  const res = {
    status: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
  }
  res.status.mockReturnValue(res)
  res.send.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  // Re-apply default resolved values cleared by clearAllMocks
  mocks.mailAdd.mockResolvedValue(mocks.mailDocRef)
  mocks.inquiriesAdd.mockResolvedValue(mocks.inquiryDocRef)
  mocks.tryOnAdd.mockResolvedValue(mocks.tryOnDocRef)
  mocks.rentalAdd.mockResolvedValue(mocks.rentalDocRef)
  mocks.rentalDocForGet.get.mockResolvedValue(mocks.rentalSnapshot)
  mocks.rentalDocForGet.update.mockResolvedValue(undefined)
  mocks.dressDocForUpdate.update.mockResolvedValue(undefined)
  mocks.mockCheckoutCreate.mockResolvedValue({
    id: 'cs_test_abc123',
    url: 'https://checkout.stripe.com/pay/cs_test_abc123',
  })
})

// ===========================================================================
// submitInquiry
// ===========================================================================
describe('submitInquiry', () => {
  describe('happy path', () => {
    it('saves the inquiry to Firestore with correct fields', async () => {
      await inquiry({ data: validInquiryData })

      expect(mocks.inquiriesAdd).toHaveBeenCalledOnce()
      const saved = mocks.inquiriesAdd.mock.calls[0][0]
      expect(saved.customerName).toBe('Sophie Chen')
      expect(saved.email).toBe('sophie@example.com')
      expect(saved.phone).toBe('021 555 1234')
      expect(saved.message).toBe('Do you have this in a size 8?')
      expect(saved.dressName).toBe('Satin Cowl Midi')
      expect(saved.status).toBe('new')
      expect(saved.source).toBe('website')
      expect(saved.createdAt).toBe('__SERVER_TIMESTAMP__')
    })

    it('returns the Firestore document id', async () => {
      const result = await inquiry({ data: validInquiryData })
      expect(result).toEqual({ id: 'inquiry_id_1' })
    })

    it('queues an admin email notification', async () => {
      await inquiry({ data: validInquiryData })

      expect(mocks.mailAdd).toHaveBeenCalledOnce()
      const mail = mocks.mailAdd.mock.calls[0][0]
      expect(mail.message.subject).toBe('New contact inquiry - The Borrow Boutique')
      expect(mail.message.text).toContain('Sophie Chen')
      expect(mail.message.text).toContain('sophie@example.com')
      expect(mail.message.text).toContain('Do you have this in a size 8?')
    })

    it('includes dress name in notification when provided', async () => {
      await inquiry({ data: validInquiryData })

      const mail = mocks.mailAdd.mock.calls[0][0]
      expect(mail.message.text).toContain('Satin Cowl Midi')
    })

    it('stores null for dressName when not provided', async () => {
      const { dressName: _, dressId: __, ...withoutDress } = validInquiryData
      await inquiry({ data: withoutDress })

      const saved = mocks.inquiriesAdd.mock.calls[0][0]
      expect(saved.dressName).toBeNull()
    })

    it('trims whitespace from string fields', async () => {
      await inquiry({ data: { ...validInquiryData, customerName: '  Sophie Chen  ', message: '  Hello  ' } })

      const saved = mocks.inquiriesAdd.mock.calls[0][0]
      expect(saved.customerName).toBe('Sophie Chen')
      expect(saved.message).toBe('Hello')
    })

    it('normalises email to lowercase', async () => {
      await inquiry({ data: { ...validInquiryData, email: 'Sophie@EXAMPLE.COM' } })

      const saved = mocks.inquiriesAdd.mock.calls[0][0]
      expect(saved.email).toBe('sophie@example.com')
    })
  })

  describe('validation', () => {
    async function expectInvalidArgument(data: Record<string, unknown>) {
      await expect(inquiry({ data })).rejects.toMatchObject({ code: 'invalid-argument' })
    }

    it('throws when customerName is missing', () =>
      expectInvalidArgument({ ...validInquiryData, customerName: '' }))

    it('throws when customerName is only whitespace', () =>
      expectInvalidArgument({ ...validInquiryData, customerName: '   ' }))

    it('throws when email is missing', () =>
      expectInvalidArgument({ ...validInquiryData, email: '' }))

    it('throws when email has no @ symbol', () =>
      expectInvalidArgument({ ...validInquiryData, email: 'notanemail.com' }))

    it('throws when email has no domain extension', () =>
      expectInvalidArgument({ ...validInquiryData, email: 'user@nodot' }))

    it('throws when phone is missing', () =>
      expectInvalidArgument({ ...validInquiryData, phone: '' }))

    it('throws when message is missing', () =>
      expectInvalidArgument({ ...validInquiryData, message: '' }))

    it('throws when message is only whitespace', () =>
      expectInvalidArgument({ ...validInquiryData, message: '   ' }))
  })
})

// ===========================================================================
// submitTryOnBooking
// ===========================================================================
describe('submitTryOnBooking', () => {
  describe('happy path', () => {
    it('saves the try-on booking to Firestore with correct fields', async () => {
      await tryOn({ data: validTryOnData })

      expect(mocks.tryOnAdd).toHaveBeenCalledOnce()
      const saved = mocks.tryOnAdd.mock.calls[0][0]
      expect(saved.customerName).toBe('Jade Kim')
      expect(saved.preferredDate).toBe('2026-08-15')
      expect(saved.preferredTime).toBe('11:00')
      expect(saved.dressName).toBe('Black Tie Gown')
      expect(saved.notes).toBe('I have a wedding on the 17th.')
      expect(saved.status).toBe('requested')
      expect(saved.source).toBe('website')
    })

    it('returns the Firestore document id', async () => {
      const result = await tryOn({ data: validTryOnData })
      expect(result).toEqual({ id: 'tryon_id_1' })
    })

    it('queues an admin email notification with date and time', async () => {
      await tryOn({ data: validTryOnData })

      const mail = mocks.mailAdd.mock.calls[0][0]
      expect(mail.message.subject).toBe('New try-on booking - The Borrow Boutique')
      expect(mail.message.text).toContain('2026-08-15')
      expect(mail.message.text).toContain('11:00')
    })

    it('stores null for notes when not provided', async () => {
      const { notes: _, ...withoutNotes } = validTryOnData
      await tryOn({ data: withoutNotes })

      const saved = mocks.tryOnAdd.mock.calls[0][0]
      expect(saved.notes).toBeNull()
    })

    it('includes notes in notification email when provided', async () => {
      await tryOn({ data: validTryOnData })

      const mail = mocks.mailAdd.mock.calls[0][0]
      expect(mail.message.text).toContain('I have a wedding on the 17th.')
    })

    it('excludes notes line from notification when notes are absent', async () => {
      const { notes: _, ...withoutNotes } = validTryOnData
      await tryOn({ data: withoutNotes })

      const mail = mocks.mailAdd.mock.calls[0][0]
      expect(mail.message.text).not.toContain('Notes:')
    })
  })

  describe('validation', () => {
    async function expectInvalidArgument(data: Record<string, unknown>) {
      await expect(tryOn({ data })).rejects.toMatchObject({ code: 'invalid-argument' })
    }

    it('throws when preferredDate uses slash separators', () =>
      expectInvalidArgument({ ...validTryOnData, preferredDate: '15/08/2026' }))

    it('throws when preferredDate is just a year', () =>
      expectInvalidArgument({ ...validTryOnData, preferredDate: '2026' }))

    it('throws when preferredDate is missing', () =>
      expectInvalidArgument({ ...validTryOnData, preferredDate: '' }))

    it('throws when preferredTime is missing', () =>
      expectInvalidArgument({ ...validTryOnData, preferredTime: '' }))

    it('throws when customerName is missing', () =>
      expectInvalidArgument({ ...validTryOnData, customerName: '' }))

    it('throws when email is invalid', () =>
      expectInvalidArgument({ ...validTryOnData, email: 'bademail' }))
  })
})

// ===========================================================================
// submitRentalRequest
// ===========================================================================
describe('submitRentalRequest', () => {
  describe('happy path', () => {
    it('saves rental request to Firestore with correct fields', async () => {
      await rental(mockRentalRequest())

      expect(mocks.rentalAdd).toHaveBeenCalledOnce()
      const saved = mocks.rentalAdd.mock.calls[0][0]
      expect(saved.customerName).toBe('Mia Tran')
      expect(saved.dressName).toBe('Evening Gown')
      expect(saved.size).toBe('S')
      expect(saved.rentalStart).toBe('2026-09-01')
      expect(saved.returnDate).toBe('2026-09-02')
      expect(saved.rentalPrice).toBe(120)
      expect(saved.shippingFee).toBe(15)
      expect(saved.totalDue).toBe(135)
      expect(saved.paymentStatus).toBe('checkout-created')
      expect(saved.status).toBe('requested')
      expect(saved.source).toBe('website')
    })

    it('creates a Stripe checkout session', async () => {
      await rental(mockRentalRequest())

      expect(mocks.mockCheckoutCreate).toHaveBeenCalledOnce()
    })

    it('includes dress rental as first line item with correct price', async () => {
      await rental(mockRentalRequest())

      const sessionArgs = mocks.mockCheckoutCreate.mock.calls[0][0]
      expect(sessionArgs.line_items[0].price_data.unit_amount).toBe(12000) // 120 * 100
      expect(sessionArgs.line_items[0].price_data.product_data.name).toBe('Evening Gown rental')
    })

    it('includes shipping as a second line item when shippingFee > 0', async () => {
      await rental(mockRentalRequest())

      const { line_items } = mocks.mockCheckoutCreate.mock.calls[0][0]
      expect(line_items).toHaveLength(2)
      expect(line_items[1].price_data.product_data.name).toBe('Shipping')
      expect(line_items[1].price_data.unit_amount).toBe(1500)
    })

    it('excludes shipping line item when shippingFee is 0', async () => {
      await rental(mockRentalRequest({ ...validRentalData, shippingFee: '0', totalDue: '120' }))

      const { line_items } = mocks.mockCheckoutCreate.mock.calls[0][0]
      expect(line_items).toHaveLength(1)
    })

    it('uses request origin for success and cancel URLs', async () => {
      await rental(mockRentalRequest())

      const sessionArgs = mocks.mockCheckoutCreate.mock.calls[0][0]
      expect(sessionArgs.success_url).toContain('https://theborrowboutique.nz')
      expect(sessionArgs.cancel_url).toContain('https://theborrowboutique.nz')
      expect(sessionArgs.success_url).toContain('payment=success')
      expect(sessionArgs.cancel_url).toContain('payment=cancelled')
    })

    it('falls back to the production URL when origin header is absent', async () => {
      await rental({ data: validRentalData, rawRequest: { headers: {} } })

      const sessionArgs = mocks.mockCheckoutCreate.mock.calls[0][0]
      expect(sessionArgs.success_url).toContain('theborrowboutique-b7006.web.app')
    })

    it('sets customer_email on the Stripe session', async () => {
      await rental(mockRentalRequest())

      const sessionArgs = mocks.mockCheckoutCreate.mock.calls[0][0]
      expect(sessionArgs.customer_email).toBe('mia@example.com')
    })

    it('updates the Firestore doc with checkout session id and url', async () => {
      await rental(mockRentalRequest())

      expect(mocks.rentalDocRef.update).toHaveBeenCalledOnce()
      const updated = mocks.rentalDocRef.update.mock.calls[0][0]
      expect(updated.checkoutSessionId).toBe('cs_test_abc123')
      expect(updated.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_abc123')
      expect(updated.paymentProvider).toBe('stripe')
    })

    it('queues admin notification email', async () => {
      await rental(mockRentalRequest())

      expect(mocks.mailAdd).toHaveBeenCalledOnce()
      const mail = mocks.mailAdd.mock.calls[0][0]
      expect(mail.message.subject).toBe('New rental booking - The Borrow Boutique')
      expect(mail.message.text).toContain('Evening Gown')
      expect(mail.message.text).toContain('mia@example.com')
    })

    it('returns id and checkoutUrl', async () => {
      const result = await rental(mockRentalRequest())

      expect(result.id).toBe('rental_id_1')
      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_abc123')
    })

    it('defaults eventDate to rentalStart when not provided', async () => {
      await rental(mockRentalRequest())

      const saved = mocks.rentalAdd.mock.calls[0][0]
      expect(saved.eventDate).toBe('2026-09-01')
    })

    it('uses provided eventDate when given', async () => {
      await rental(mockRentalRequest({ ...validRentalData, eventDate: '2026-09-03' }))

      const saved = mocks.rentalAdd.mock.calls[0][0]
      expect(saved.eventDate).toBe('2026-09-03')
    })
  })

  describe('validation', () => {
    async function expectInvalidArgument(data: Record<string, unknown>) {
      await expect(rental({ data, rawRequest: { headers: {} } })).rejects.toMatchObject({
        code: 'invalid-argument',
      })
    }

    it('throws when rentalStart has invalid date format', () =>
      expectInvalidArgument({ ...validRentalData, rentalStart: '01/09/2026' }))

    it('throws when returnDate has invalid date format', () =>
      expectInvalidArgument({ ...validRentalData, returnDate: 'tomorrow' }))

    it('throws when rentalPrice is negative', () =>
      expectInvalidArgument({ ...validRentalData, rentalPrice: '-10' }))

    it('throws when rentalPrice is not a number', () =>
      expectInvalidArgument({ ...validRentalData, rentalPrice: 'free' }))

    it('throws when dressName is missing', () =>
      expectInvalidArgument({ ...validRentalData, dressName: '' }))

    it('throws when size is missing', () =>
      expectInvalidArgument({ ...validRentalData, size: '' }))

    it('throws when deliveryMethod is missing', () =>
      expectInvalidArgument({ ...validRentalData, deliveryMethod: '' }))

    it('throws when customer email is invalid', () =>
      expectInvalidArgument({ ...validRentalData, email: 'bad-email' }))
  })
})

// ===========================================================================
// stripeWebhook
// ===========================================================================
describe('stripeWebhook', () => {
  describe('signature validation', () => {
    it('returns 400 when stripe-signature header is absent', async () => {
      const req = makeWebhookRequest({ headers: {} })
      const res = makeWebhookResponse()

      await webhook(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith('Missing Stripe signature.')
      expect(res.json).not.toHaveBeenCalled()
    })

    it('returns 400 when Stripe signature verification throws', async () => {
      mocks.mockConstructEvent.mockImplementationOnce(() => {
        throw new Error('Signature mismatch')
      })
      const req = makeWebhookRequest()
      const res = makeWebhookResponse()

      await webhook(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith('Invalid Stripe webhook signature.')
    })
  })

  describe('unhandled event types', () => {
    it('returns { received: true } without touching Firestore', async () => {
      mocks.mockConstructEvent.mockReturnValueOnce({ type: 'payment_intent.created', data: { object: {} } })
      const req = makeWebhookRequest()
      const res = makeWebhookResponse()

      await webhook(req, res)

      expect(res.json).toHaveBeenCalledWith({ received: true })
      expect(mocks.rentalDocForGet.update).not.toHaveBeenCalled()
    })
  })

  describe('checkout.session.completed', () => {
    const rentalData = {
      customerName: 'Mia Tran',
      email: 'mia@example.com',
      dressId: 'dress_abc',
      dressName: 'Evening Gown',
      size: 'S',
      rentalStart: '2026-09-05',
      returnDate: '2026-09-08',
      rentalPrice: 120,
      shippingFee: 15,
      totalDue: 135,
      deliveryMethod: 'Post',
    }

    const completedSession = {
      type: 'checkout.session.completed' as const,
      data: {
        object: {
          id: 'cs_test_abc123',
          payment_intent: 'pi_test_xyz',
          amount_total: 13500,
          customer_details: { email: 'mia@example.com' },
          metadata: { rentalRequestId: 'rental_id_1' },
        },
      },
    }

    beforeEach(() => {
      mocks.mockConstructEvent.mockReturnValue(completedSession)
      mocks.rentalSnapshot.data.mockReturnValue(rentalData)
      mocks.rentalDoc.mockReturnValue(mocks.rentalDocForGet)
      mocks.dressDoc.mockReturnValue(mocks.dressDocForUpdate)
    })

    it('marks the rental as paid in Firestore', async () => {
      await webhook(makeWebhookRequest(), makeWebhookResponse())

      expect(mocks.rentalDocForGet.update).toHaveBeenCalledOnce()
      const update = mocks.rentalDocForGet.update.mock.calls[0][0]
      expect(update.paymentStatus).toBe('paid')
      expect(update.paidAt).toBe('__SERVER_TIMESTAMP__')
    })

    it('stores the stripePaymentIntentId from a string value', async () => {
      await webhook(makeWebhookRequest(), makeWebhookResponse())

      const update = mocks.rentalDocForGet.update.mock.calls[0][0]
      expect(update.stripePaymentIntentId).toBe('pi_test_xyz')
    })

    it('stores the stripePaymentIntentId from a nested object', async () => {
      mocks.mockConstructEvent.mockReturnValueOnce({
        ...completedSession,
        data: {
          object: {
            ...completedSession.data.object,
            payment_intent: { id: 'pi_from_object' },
          },
        },
      })

      await webhook(makeWebhookRequest(), makeWebhookResponse())

      const update = mocks.rentalDocForGet.update.mock.calls[0][0]
      expect(update.stripePaymentIntentId).toBe('pi_from_object')
    })

    it('blocks the correct dates on the dress document', async () => {
      await webhook(makeWebhookRequest(), makeWebhookResponse())

      expect(mocks.dressDocForUpdate.update).toHaveBeenCalledOnce()
      const dressUpdate = mocks.dressDocForUpdate.update.mock.calls[0][0]
      // getBlockedDates starts one day before rentalStart (2026-09-04) through returnDate (2026-09-08)
      expect(dressUpdate.bookedDates.values).toContain('2026-09-04') // day before
      expect(dressUpdate.bookedDates.values).toContain('2026-09-05') // rentalStart
      expect(dressUpdate.bookedDates.values).toContain('2026-09-08') // returnDate
      expect(dressUpdate.bookedDates.values).toHaveLength(5)
    })

    it('sends customer confirmation email to the renter address', async () => {
      await webhook(makeWebhookRequest(), makeWebhookResponse())

      // mailAdd called twice: customer confirmation + admin notification
      expect(mocks.mailAdd).toHaveBeenCalledTimes(2)
      const customerMail = mocks.mailAdd.mock.calls[0][0]
      expect(customerMail.to).toEqual(['mia@example.com'])
      expect(customerMail.message.subject).toContain('Booking confirmed')
    })

    it('queues admin payment received notification', async () => {
      await webhook(makeWebhookRequest(), makeWebhookResponse())

      const adminMail = mocks.mailAdd.mock.calls[1][0]
      expect(adminMail.message.subject).toBe('Rental payment received - The Borrow Boutique')
      expect(adminMail.message.text).toContain('rental_id_1')
      expect(adminMail.message.text).toContain('135.00 NZD')
    })

    it('returns { received: true } after processing', async () => {
      const res = makeWebhookResponse()
      await webhook(makeWebhookRequest(), res)

      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('skips all Firestore writes when rentalRequestId is absent from metadata', async () => {
      mocks.mockConstructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_no_meta', metadata: {} } },
      })
      const res = makeWebhookResponse()
      await webhook(makeWebhookRequest(), res)

      expect(mocks.rentalDocForGet.update).not.toHaveBeenCalled()
      expect(mocks.mailAdd).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('skips date blocking when rental has no dressId', async () => {
      const { dressId: _, ...noDressId } = rentalData
      mocks.rentalSnapshot.data.mockReturnValueOnce(noDressId)

      await webhook(makeWebhookRequest(), makeWebhookResponse())

      expect(mocks.dressDocForUpdate.update).not.toHaveBeenCalled()
    })

    it('skips customer email when rental snapshot data is null', async () => {
      mocks.rentalSnapshot.data.mockReturnValueOnce(null)

      await webhook(makeWebhookRequest(), makeWebhookResponse())

      // mailAdd should NOT have been called for customer email (only admin maybe)
      // In the code: if (rental) { await sendCustomerConfirmationEmail(...) } so it's skipped
      // But admin notification IS still called
      const calls = mocks.mailAdd.mock.calls
      const hasCustomerMail = calls.some((c) => Array.isArray(c[0]?.to) && c[0].to[0] !== 'nadiaaskari777@gmail.com')
      expect(hasCustomerMail).toBe(false)
    })
  })
})

// ===========================================================================
// getBlockedDates edge cases (tested via webhook)
// ===========================================================================
describe('getBlockedDates', () => {
  beforeEach(() => {
    mocks.mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          payment_intent: 'pi_test',
          amount_total: 10000,
          customer_details: { email: 'test@example.com' },
          metadata: { rentalRequestId: 'rental_id_1' },
        },
      },
    })
  })

  it('includes the day before rentalStart through returnDate for a 1-day rental', async () => {
    mocks.rentalSnapshot.data.mockReturnValue({
      email: 'test@example.com',
      dressId: 'dress_1',
      rentalStart: '2026-10-01',
      returnDate: '2026-10-01',
      rentalPrice: 100,
      shippingFee: 0,
      totalDue: 100,
      deliveryMethod: 'Pick up',
      customerName: 'Test',
      dressName: 'Test Dress',
      size: 'S',
    })

    await webhook(makeWebhookRequest(), makeWebhookResponse())

    const { values } = mocks.dressDocForUpdate.update.mock.calls[0][0].bookedDates
    expect(values).toEqual(['2026-09-30', '2026-10-01']) // day before + rental day
  })

  it('covers all days for a multi-day rental', async () => {
    mocks.rentalSnapshot.data.mockReturnValue({
      email: 'test@example.com',
      dressId: 'dress_1',
      rentalStart: '2026-10-10',
      returnDate: '2026-10-13',
      rentalPrice: 100,
      shippingFee: 0,
      totalDue: 100,
      deliveryMethod: 'Post',
      customerName: 'Test',
      dressName: 'Test Dress',
      size: 'M',
    })

    await webhook(makeWebhookRequest(), makeWebhookResponse())

    const { values } = mocks.dressDocForUpdate.update.mock.calls[0][0].bookedDates
    expect(values).toEqual([
      '2026-10-09', // day before rentalStart
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13', // returnDate
    ])
  })
})
