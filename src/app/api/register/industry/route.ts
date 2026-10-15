import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { industryRegistrationSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = industryRegistrationSchema.parse(body);

    const registrationNumber = `REG${Date.now().toString().slice(-8)}`;

    const [registration] = await db
      .insert(registrations)
      .values({
        registrationNumber,
        registrationType: 'industry_professional',
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        country: validatedData.country,
        state: validatedData.state,
        jobTitle: validatedData.jobTitle,
        companyName: validatedData.companyName,
        industryType: validatedData.industryType,
        department: validatedData.department,
        yearsOfExperience: validatedData.yearsOfExperience,
        documentObjectKey: validatedData.documentObjectKey,
        documentOriginalName: validatedData.documentOriginalName,
        documentMimeType: validatedData.documentMimeType,
        documentSize: validatedData.documentSize,
        additionalInfo: validatedData.additionalInfo,
        consentPrivacy: validatedData.consentPrivacy,
        consentTerms: validatedData.consentTerms,
        paymentAmount: 3000,
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
    console.error('Error creating industry registration:', error);
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
