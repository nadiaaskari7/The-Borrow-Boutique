"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.submitRentalRequest = exports.submitTryOnBooking = exports.submitInquiry = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
const stripe_1 = require("stripe");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const NOTIFICATION_EMAIL = 'nadiaaskari777@gmail.com';
const stripeSecretKey = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const stripeWebhookSecret = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function optionalString(value) {
    const cleaned = cleanString(value);
    return cleaned || null;
}
function requiredString(data, key) {
    const value = cleanString(data[key]);
    if (!value) {
        throw new https_1.HttpsError('invalid-argument', `${key} is required.`);
    }
    return value;
}
function requiredEmail(data) {
    const email = requiredString(data, 'email').toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
        throw new https_1.HttpsError('invalid-argument', 'A valid email is required.');
    }
    return email;
}
function requiredNumber(data, key) {
    const value = Number(data[key]);
    if (!Number.isFinite(value) || value < 0) {
        throw new https_1.HttpsError('invalid-argument', `${key} must be a valid number.`);
    }
    return value;
}
function commonCustomerFields(data) {
    return {
        customerName: requiredString(data, 'customerName'),
        email: requiredEmail(data),
        phone: requiredString(data, 'phone'),
    };
}
function assertDateString(value, fieldName) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a valid date.`);
    }
    return value;
}
function getRequestOrigin(request) {
    const origin = request.rawRequest.headers.origin;
    if (typeof origin === 'string' && origin.startsWith('http')) {
        return origin;
    }
    return 'https://theborrowboutique-b7006.web.app';
}
function getBlockedDates(rentalStart, returnDate) {
    const dates = [];
    const current = new Date(`${rentalStart}T00:00:00`);
    current.setDate(current.getDate() - 1);
    const end = new Date(`${returnDate}T00:00:00`);
    while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
function formatDate(dateStr) {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
async function sendCustomerConfirmationEmail(rental, bookingId) {
    const firstName = rental.customerName?.split(' ')[0] ?? rental.customerName ?? 'there';
    const rentalStartFormatted = formatDate(rental.rentalStart);
    const returnDateFormatted = formatDate(rental.returnDate);
    const rentalPrice = Number(rental.rentalPrice ?? 0).toFixed(2);
    const shippingFee = Number(rental.shippingFee ?? 0).toFixed(2);
    const totalDue = Number(rental.totalDue ?? 0).toFixed(2);
    const hasShipping = Number(rental.shippingFee) > 0;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf2f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#be185d;padding:36px 40px;text-align:center;border-radius:12px 12px 0 0;">
            <p style="margin:0 0 4px;color:#fce7f3;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">The Borrow Boutique</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:normal;">Booking Confirmed</h1>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 24px;">
            <p style="margin:0 0 12px;color:#4a1942;font-size:16px;">Hi ${firstName},</p>
            <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;">Thank you for your rental — your booking is confirmed and payment has been received. Everything you need to know is below.</p>
          </td>
        </tr>

        <!-- Dress details -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f4;border-radius:8px;padding:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 16px;color:#be185d;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Your Rental</p>
                  <p style="margin:0 0 4px;color:#1f2937;font-size:20px;">${rental.dressName}</p>
                  <p style="margin:0;color:#6b7280;font-size:14px;font-family:Arial,sans-serif;">Size ${rental.size}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Dates -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f4;border-radius:8px;padding:20px;">
                    <tr><td>
                      <p style="margin:0 0 6px;color:#be185d;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Rental Start</p>
                      <p style="margin:0;color:#1f2937;font-size:14px;font-family:Arial,sans-serif;">${rentalStartFormatted}</p>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fce7f3;border:2px solid #be185d;border-radius:8px;padding:20px;">
                    <tr><td>
                      <p style="margin:0 0 6px;color:#be185d;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Return By</p>
                      <p style="margin:0;color:#1f2937;font-size:14px;font-weight:bold;font-family:Arial,sans-serif;">${returnDateFormatted}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Delivery -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f4;border-radius:8px;padding:20px;">
              <tr>
                <td>
                  <p style="margin:0 0 6px;color:#be185d;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Delivery</p>
                  <p style="margin:0;color:#1f2937;font-size:14px;font-family:Arial,sans-serif;">${rental.deliveryMethod}${rental.deliveryNotes ? ' — ' + rental.deliveryNotes : ''}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Receipt -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 24px;">
            <p style="margin:0 0 12px;color:#be185d;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Payment Receipt</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #fce7f3;">
              <tr>
                <td style="padding:10px 0;color:#6b7280;font-size:14px;font-family:Arial,sans-serif;">Dress rental</td>
                <td align="right" style="padding:10px 0;color:#1f2937;font-size:14px;font-family:Arial,sans-serif;">$${rentalPrice} NZD</td>
              </tr>
              ${hasShipping ? `<tr>
                <td style="padding:10px 0;color:#6b7280;font-size:14px;font-family:Arial,sans-serif;border-top:1px solid #fce7f3;">Shipping</td>
                <td align="right" style="padding:10px 0;color:#1f2937;font-size:14px;font-family:Arial,sans-serif;border-top:1px solid #fce7f3;">$${shippingFee} NZD</td>
              </tr>` : ''}
              <tr>
                <td style="padding:14px 0 0;color:#1f2937;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;border-top:2px solid #be185d;">Total paid</td>
                <td align="right" style="padding:14px 0 0;color:#be185d;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;border-top:2px solid #be185d;">$${totalDue} NZD</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Return reminder -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fce7f3;border-left:4px solid #be185d;border-radius:0 8px 8px 0;padding:20px;">
              <tr><td>
                <p style="margin:0 0 6px;color:#be185d;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">Return reminder</p>
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">Please return or post the dress back by <strong style="color:#1f2937;">${returnDateFormatted}</strong>. Weekday rentals are returned the following day; weekend rentals are returned the following Monday. A return bag will be provided for posted rentals.</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fdf2f4;padding:28px 40px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #fce7f3;">
            <p style="margin:0 0 4px;color:#be185d;font-size:14px;font-family:Arial,sans-serif;">Questions? Get in touch at <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#be185d;">${NOTIFICATION_EMAIL}</a></p>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">The Borrow Boutique · New Zealand</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
    await db.collection('mail').add({
        to: [rental.email],
        message: {
            subject: `Booking confirmed — ${rental.dressName} · The Borrow Boutique`,
            html,
            text: [
                `Hi ${firstName}, your booking is confirmed!`,
                `Dress: ${rental.dressName} (Size ${rental.size})`,
                `Rental start: ${rentalStartFormatted}`,
                `Return by: ${returnDateFormatted}`,
                `Delivery: ${rental.deliveryMethod}`,
                `Total paid: $${totalDue} NZD`,
                `Booking ID: ${bookingId}`,
                `Questions? Email ${NOTIFICATION_EMAIL}`,
            ].join('\n'),
        },
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
async function queueEmailNotification(subject, lines) {
    await db.collection('mail').add({
        to: [NOTIFICATION_EMAIL],
        message: {
            subject,
            text: lines.filter(Boolean).join('\n'),
            html: lines
                .filter(Boolean)
                .map((line) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
                .join(''),
        },
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
exports.submitInquiry = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const data = request.data;
    const message = requiredString(data, 'message');
    const customer = commonCustomerFields(data);
    const dressName = optionalString(data.dressName);
    const doc = await db.collection('inquiries').add({
        ...customer,
        dressId: optionalString(data.dressId),
        dressName,
        message,
        status: 'new',
        source: 'website',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await queueEmailNotification('New contact inquiry - The Borrow Boutique', [
        `Name: ${customer.customerName}`,
        `Email: ${customer.email}`,
        `Phone: ${customer.phone}`,
        dressName ? `Dress: ${dressName}` : '',
        `Message: ${message}`,
        `Inquiry ID: ${doc.id}`,
    ]);
    return { id: doc.id };
});
exports.submitTryOnBooking = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const data = request.data;
    const preferredDate = assertDateString(requiredString(data, 'preferredDate'), 'preferredDate');
    const preferredTime = requiredString(data, 'preferredTime');
    const customer = commonCustomerFields(data);
    const dressName = optionalString(data.dressName);
    const notes = optionalString(data.notes);
    const doc = await db.collection('tryOnBookings').add({
        ...customer,
        preferredDate,
        preferredTime,
        dressId: optionalString(data.dressId),
        dressName,
        notes,
        status: 'requested',
        source: 'website',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await queueEmailNotification('New try-on booking - The Borrow Boutique', [
        `Name: ${customer.customerName}`,
        `Email: ${customer.email}`,
        `Phone: ${customer.phone}`,
        `Preferred date: ${preferredDate}`,
        `Preferred time: ${preferredTime}`,
        dressName ? `Dress: ${dressName}` : '',
        notes ? `Notes: ${notes}` : '',
        `Try-on ID: ${doc.id}`,
    ]);
    return { id: doc.id };
});
exports.submitRentalRequest = (0, https_1.onCall)({ region: 'us-central1', secrets: [stripeSecretKey] }, async (request) => {
    const data = request.data;
    const rentalStart = assertDateString(requiredString(data, 'rentalStart'), 'rentalStart');
    const eventDate = data.eventDate ? assertDateString(cleanString(data.eventDate), 'eventDate') : rentalStart;
    const returnDate = assertDateString(requiredString(data, 'returnDate'), 'returnDate');
    const rentalPrice = requiredNumber(data, 'rentalPrice');
    const shippingFee = requiredNumber(data, 'shippingFee');
    const totalDue = requiredNumber(data, 'totalDue');
    const customer = commonCustomerFields(data);
    const dressName = requiredString(data, 'dressName');
    const size = requiredString(data, 'size');
    const deliveryMethod = requiredString(data, 'deliveryMethod');
    const deliveryNotes = optionalString(data.deliveryNotes);
    const doc = await db.collection('rentalRequests').add({
        ...customer,
        eventDate,
        rentalStart,
        returnDate,
        dressId: requiredString(data, 'dressId'),
        dressName,
        size,
        sizes: optionalString(data.sizes),
        rawSize: optionalString(data.rawSize),
        rawSizes: optionalString(data.rawSizes),
        rentalPrice,
        shippingFee,
        totalDue,
        deliveryMethod,
        deliveryNotes,
        paymentStatus: 'checkout-created',
        status: 'requested',
        source: 'website',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const stripe = new stripe_1.default(stripeSecretKey.value());
    const origin = getRequestOrigin(request);
    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customer.email,
        success_url: `${origin}?payment=success&rentalRequestId=${doc.id}`,
        cancel_url: `${origin}?payment=cancelled&rentalRequestId=${doc.id}`,
        metadata: {
            rentalRequestId: doc.id,
            dressId: requiredString(data, 'dressId'),
            dressName,
            size,
        },
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'nzd',
                    product_data: {
                        name: `${dressName} rental`,
                        description: `Size ${size}. Rental ${rentalStart} to ${returnDate}.`,
                    },
                    unit_amount: Math.round(rentalPrice * 100),
                },
            },
            ...(shippingFee > 0
                ? [
                    {
                        quantity: 1,
                        price_data: {
                            currency: 'nzd',
                            product_data: {
                                name: 'Shipping',
                            },
                            unit_amount: Math.round(shippingFee * 100),
                        },
                    },
                ]
                : []),
        ],
    });
    await doc.update({
        checkoutSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        paymentProvider: 'stripe',
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await queueEmailNotification('New rental booking - The Borrow Boutique', [
        `Name: ${customer.customerName}`,
        `Email: ${customer.email}`,
        `Phone: ${customer.phone}`,
        `Dress: ${dressName}`,
        `Size: ${size}`,
        `Rental start: ${rentalStart}`,
        `Return date: ${returnDate}`,
        `Delivery method: ${deliveryMethod}`,
        deliveryNotes ? `Delivery notes: ${deliveryNotes}` : '',
        `Rental price: $${rentalPrice}`,
        `Shipping fee: $${shippingFee}`,
        `Total due: $${totalDue}`,
        `Rental request ID: ${doc.id}`,
    ]);
    return { id: doc.id, checkoutUrl: checkoutSession.url };
});
exports.stripeWebhook = (0, https_1.onRequest)({ region: 'us-central1', secrets: [stripeSecretKey, stripeWebhookSecret] }, async (request, response) => {
    const stripe = new stripe_1.default(stripeSecretKey.value());
    const signature = request.headers['stripe-signature'];
    if (!signature) {
        response.status(400).send('Missing Stripe signature.');
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.rawBody, signature, stripeWebhookSecret.value());
    }
    catch (error) {
        console.error(error);
        response.status(400).send('Invalid Stripe webhook signature.');
        return;
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const rentalRequestId = session.metadata?.rentalRequestId;
        if (rentalRequestId) {
            const rentalDoc = await db.collection('rentalRequests').doc(rentalRequestId).get();
            const rental = rentalDoc.data();
            await db.collection('rentalRequests').doc(rentalRequestId).update({
                paymentStatus: 'paid',
                paidAt: firestore_1.FieldValue.serverTimestamp(),
                stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            if (rental?.dressId && rental?.rentalStart && rental?.returnDate) {
                const blockedDates = getBlockedDates(rental.rentalStart, rental.returnDate);
                await db.collection('Dresses').doc(rental.dressId).update({
                    bookedDates: firestore_1.FieldValue.arrayUnion(...blockedDates),
                });
            }
            if (rental) {
                await sendCustomerConfirmationEmail(rental, rentalRequestId);
            }
            await queueEmailNotification('Rental payment received - The Borrow Boutique', [
                `Rental request ID: ${rentalRequestId}`,
                `Stripe checkout session: ${session.id}`,
                session.customer_details?.email ? `Customer email: ${session.customer_details.email}` : '',
                session.amount_total ? `Amount paid: $${(session.amount_total / 100).toFixed(2)} NZD` : '',
            ]);
        }
    }
    response.json({ received: true });
});
//# sourceMappingURL=index.js.map