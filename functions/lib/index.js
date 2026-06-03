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
    const eventDate = assertDateString(requiredString(data, 'eventDate'), 'eventDate');
    const rentalStart = assertDateString(requiredString(data, 'rentalStart'), 'rentalStart');
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
        `Event date: ${eventDate}`,
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
            await db.collection('rentalRequests').doc(rentalRequestId).update({
                paymentStatus: 'paid',
                paidAt: firestore_1.FieldValue.serverTimestamp(),
                stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
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