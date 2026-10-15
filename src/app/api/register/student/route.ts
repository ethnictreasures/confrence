import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { studentRegistrationApiSchema } from '@/lib/validation';
import { REGISTRATION_PRICING } from '@/config/conference';
import { configuredPaymentLinkId } from '@/lib/razorpay';
import { validateUploadedDocument } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = studentRegistrationApiSchema.parse(body);
    const documentIsValid = await validateUploadedDocument(validatedData.documentObjectKey, validatedData.documentMimeType, validatedData.documentSize);
    if (!documentIsValid) return NextResponse.json({ error: 'Uploaded student ID could not be verified.' }, { status: 400 });
    const pricing = REGISTRATION_PRICING.student;

    const registrationNumber = `REG${Date.now().toString().slice(-8)}${randomUUID().slice(0, 4).toUpperCase()}`;

    const [registration] = await db
      .insert(registrations)
      .values({
        registrationNumber: registrationNumber,
        registrationType: 'student',
        fullName: validatedData.fullName,
        email: validatedData.email.trim().toLowerCase(),
        phone: validatedData.phone,
        country: validatedData.country,
        state: validatedData.state,
        collegeName: validatedData.collegeName,
        degreeProgram: validatedData.degreeProgram,
        department: validatedData.department,
        currentYear: validatedData.currentYear,
        expectedGraduationYear: validatedData.expectedGraduationYear,
        documentObjectKey: validatedData.documentObjectKey || null,
        documentOriginalName: validatedData.documentOriginalName || null,
        documentMimeType: validatedData.documentMimeType || null,
        documentSize: validatedData.documentSize || null,
        additionalInfo: validatedData.additionalInfo || null,
        consentPrivacy: validatedData.consentPrivacy,
        consentTerms: validatedData.consentTerms,
        paymentAmount: (pricing.totalAmountPaise / 100).toFixed(2),
        baseFeePaise: pricing.baseFeePaise,
        gstRate: pricing.gstRate.toFixed(2),
        gstAmountPaise: pricing.gstAmountPaise,
        totalAmountPaise: pricing.totalAmountPaise,
        currency: 'INR',
        verificationStatus: 'pending',
        paymentStatus: 'pending',
        paymentReconciliationStatus: 'pending',
        paymentLinkId: configuredPaymentLinkId('student'),
      })
      .returning();

    return NextResponse.json({
      registrationId: registration.id,
      registrationNumber: registration.registrationNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid registration or document details' }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Registration with this email already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating student registration:', error);
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
