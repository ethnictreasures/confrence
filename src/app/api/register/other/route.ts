import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { otherRegistrationSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = otherRegistrationSchema.parse(body);

    const registrationNumber = `REG${Date.now().toString().slice(-8)}`;

    const [registration] = await db
      .insert(registrations)
      .values({
        registrationNumber,
        registrationType: 'other',
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        country: validatedData.country,
        state: validatedData.state,
        participantCategory: validatedData.participantCategory,
        occupation: validatedData.occupation,
        organizationName: validatedData.organizationName,
        purposeOfAttending: validatedData.purposeOfAttending,
        documentObjectKey: validatedData.documentObjectKey || null,
        documentOriginalName: validatedData.documentOriginalName || null,
        documentMimeType: validatedData.documentMimeType || null,
        documentSize: validatedData.documentSize || null,
        additionalInfo: validatedData.additionalInfo,
        consentPrivacy: validatedData.consentPrivacy,
        consentTerms: validatedData.consentTerms,
        paymentAmount: 2000,
        currency: 'INR',
        verificationStatus: 'pending',
        paymentStatus: 'pending',
      })
      .returning();

    return NextResponse.json({
      registrationId: registration.id,
      registrationNumber: registration.registrationNumber,
    });
  } catch (error) {
    console.error('Error creating other registration:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Registration with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
