'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { industryRegistrationSchema, type IndustryRegistrationInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function IndustryRegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IndustryRegistrationInput>({
    resolver: zodResolver(industryRegistrationSchema),
  });

  const onSubmit = async (data: IndustryRegistrationInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const file = data.professionalDocument;

      const presignedResponse = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, objectKey } = await presignedResponse.json();

      setUploadProgress(10);
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document');
      }

      setUploadProgress(50);

      const registrationData = {
        ...data,
        documentObjectKey: objectKey,
        documentOriginalName: file.name,
        documentMimeType: file.type,
        documentSize: file.size,
      };

      const registrationResponse = await fetch('/api/register/industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      setUploadProgress(90);

      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const result = await registrationResponse.json();
      setUploadProgress(100);

      router.push(`/register/payment/${result.registrationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/register" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration Types
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Industry Professional Registration</CardTitle>
              <CardDescription>
                Complete the form below to register as an industry professional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" {...register('fullName')} className="text-black" placeholder="Enter your full name" />
                    {errors.fullName?.message && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" {...register('email')} className="text-black" placeholder="your.email@example.com" />
                      {errors.email?.message && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone">Mobile Number *</Label>
                      <Input id="phone" {...register('phone')} className="text-black" placeholder="+91 98765 43210" />
                      {errors.phone?.message && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" {...register('country')} className="text-black" placeholder="India" />
                      {errors.country?.message && <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" {...register('state')} className="text-black" placeholder="Karnataka" />
                      {errors.state?.message && <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jobTitle">Job Title/Designation *</Label>
                      <Input id="jobTitle" {...register('jobTitle')} className="text-black" placeholder="Software Engineer" />
                      {errors.jobTitle?.message && <p className="text-red-600 text-sm mt-1">{errors.jobTitle.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="companyName">Company/Organization Name *</Label>
                      <Input id="companyName" {...register('companyName')} className="text-black" placeholder="ABC Technologies" />
                      {errors.companyName?.message && <p className="text-red-600 text-sm mt-1">{errors.companyName.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industryType">Industry Type *</Label>
                      <Input id="industryType" {...register('industryType')} className="text-black" placeholder="Technology" />
                      {errors.industryType?.message && <p className="text-red-600 text-sm mt-1">{errors.industryType.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Input id="department" {...register('department')} className="text-black" placeholder="Engineering" />
                      {errors.department?.message && <p className="text-red-600 text-sm mt-1">{errors.department.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="yearsOfExperience">Years of Professional Experience *</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      {...register('yearsOfExperience', { valueAsNumber: true })}
                      placeholder="5" className="text-black"
                    />
                    {errors.yearsOfExperience?.message && <p className="text-red-600 text-sm mt-1">{errors.yearsOfExperience.message}</p>}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Professional Identity Document *</h3>
                  <p className="text-sm text-gray-600">
                    Upload your employee ID, company authorization letter, or other professional proof. Accepted formats: JPEG, PNG, PDF. Maximum size: 5MB.
                  </p>

                  <div>
                    <Label htmlFor="professionalDocument">Upload Document</Label>
                    <Input
                      id="professionalDocument"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      {...register('professionalDocument')}
                      className="file:mr-4 text-black file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {errors.professionalDocument?.message && <p className="text-red-600 text-sm mt-1">{String(errors.professionalDocument.message)}</p>}
                  </div>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  <textarea
                    id="additionalInfo"
                    {...register('additionalInfo')}
                    className="flex w-full rounded-md text-black border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[100px]"
                    placeholder="Any additional information you'd like to share"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consentPrivacy" {...register('consentPrivacy')} className="mt-1" />
                    <Label htmlFor="consentPrivacy" className="text-sm">
                      I consent to the privacy policy and agree to the collection and processing of my personal data *
                    </Label>
                  </div>
                  {errors.consentPrivacy?.message && <p className="text-red-600 text-sm">{errors.consentPrivacy.message}</p>}

                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consentTerms" {...register('consentTerms')} className="mt-1 text-black" />
                    <Label htmlFor="consentTerms" className="text-sm">
                      I agree to the registration terms and conditions *
                    </Label>
                  </div>
                  {errors.consentTerms?.message && <p className="text-red-600 text-sm">{errors.consentTerms.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Registration...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
