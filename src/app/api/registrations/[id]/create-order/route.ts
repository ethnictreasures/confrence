
import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { registrations } from '@/db/schema';
import { REGISTRATION_PRICING } from '@/config/conference';
import {
    createRazorpayOrder,
    fetchRazorpayOrder,
} from '@/lib/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        if (
            typeof id !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        ) {
            return NextResponse.json(
                { message: 'Invalid registration ID.' },
                { status: 400 },
            );
        }

        const [registration] = await db
            .select()
            .from(registrations)
            .where(eq(registrations.id, id))
            .limit(1);

        if (!registration) {
            return NextResponse.json(
                { message: 'Registration not found.' },
                { status: 404 },
            );
        }

        if (
            registration.registrationType !== 'student' &&
            registration.registrationType !== 'industry_professional'
        ) {
            return NextResponse.json(
                { message: 'Unsupported registration category.' },
                { status: 400 },
            );
        }

        if (
            registration.paymentStatus === 'paid' ||
            registration.paymentStatus === 'partially_refunded' ||
            registration.paymentStatus === 'refunded'
        ) {
            return NextResponse.json(
                { message: 'Payment has already been recorded. Please check your registration status.' },
                { status: 409 },
            );
        }

        if (
            registration.paymentStatus === 'cancelled' ||
            registration.paymentStatus === 'expired'
        ) {
            return NextResponse.json(
                { message: 'This registration is not currently eligible for payment.' },
                { status: 409 },
            );
        }

        const pricing = REGISTRATION_PRICING[registration.registrationType];
        const expectedAmount = pricing.totalAmountPaise;

        if (
            !Number.isSafeInteger(expectedAmount) ||
            expectedAmount <= 0 ||
            registration.totalAmountPaise !== expectedAmount
        ) {
            console.error('[Create order] Registration amount mismatch:', {
                registrationId: registration.id,
                registrationType: registration.registrationType,
            });

            return NextResponse.json(
                { message: 'Registration payment amount is invalid. Please contact support.' },
                { status: 409 },
            );
        }

        const keyId = process.env.RAZORPAY_KEY_ID?.trim();

        if (!keyId || !process.env.RAZORPAY_KEY_SECRET?.trim()) {
            return NextResponse.json(
                { message: 'Payment service is temporarily unavailable.' },
                { status: 503 },
            );
        }

        // Reuse the saved order when possible, rather than creating a new
        // order every time the user clicks the payment button.
        if (registration.razorpayOrderId) {
            const existingOrder = await fetchRazorpayOrder(
                registration.razorpayOrderId,
            );

            if (
                existingOrder &&
                existingOrder.id === registration.razorpayOrderId &&
                existingOrder.amount === expectedAmount &&
                existingOrder.currency === 'INR' &&
                existingOrder.status === 'created'
            ) {
                return NextResponse.json({
                    orderId: existingOrder.id,
                    amount: existingOrder.amount,
                    currency: existingOrder.currency,
                    keyId,
                });
            }

            // Do not silently replace an order that may already have a payment
            // attempt or may have been paid. Resolve its status first.
            return NextResponse.json(
                {
                    message: 'Your existing payment order needs to be checked before another order can be created. Please refresh your status or contact support.',
                },
                { status: 409 },
            );
        }

        const order = await createRazorpayOrder({
            registrationId: registration.id,
            registrationNumber: registration.registrationNumber,
            registrationType: registration.registrationType,
        });

        if (
            order.amount !== expectedAmount ||
            order.currency !== 'INR' ||
            order.status !== 'created'
        ) {
            console.error('[Create order] Returned order failed validation:', {
                registrationId: registration.id,
                orderId: order.id,
            });

            return NextResponse.json(
                { message: 'The payment order could not be validated.' },
                { status: 502 },
            );
        }

        // Persist the order before exposing it to the browser.
        // Conditional update prevents overwriting an order created by another
        // request that won the race.
        const savedRows = await db
            .update(registrations)
            .set({
                razorpayOrderId: order.id,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(registrations.id, registration.id),
                    isNull(registrations.razorpayOrderId),
                ),
            )
            .returning({
                id: registrations.id,
                razorpayOrderId: registrations.razorpayOrderId,
            });
        if (
            savedRows.length !== 1 ||
            savedRows[0].razorpayOrderId !== order.id
        ) {
            // Another request may have saved a different order. Do not return
            // this order to the browser as if it belonged to the registration.
            return NextResponse.json(
                { message: 'A payment order is already being prepared. Please retry shortly.' },
                { status: 409 },
            );
        }

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
        });
    } catch (error) {
        console.error('[Create order] Failed:', error);

        return NextResponse.json(
            { message: 'Unable to create a payment order. Please try again shortly.' },
            { status: 500 },
        );
    }
}
