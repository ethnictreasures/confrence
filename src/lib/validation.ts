import { z } from 'zod';

// Common validation schemas
const emailSchema = z.string().email('Invalid email address');
const phoneSchema = z.string().regex(/^[+]?[\d\s-]{10,20}$/, 'Invalid phone number');
const registrationNumberSchema = z.string().min(1, 'Registration number is required');

// Student registration schema
export const studentRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  collegeName: z.string().min(2, 'College name is required'),
  degreeProgram: z.string().min(2, 'Degree program is required'),
  department: z.string().min(2, 'Department is required'),
  currentYear: z.string().min(1, 'Current year is required'),
  expectedGraduationYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 10),
  country: z.string().min(2, 'Country is required'),
  state: z.string().min(2, 'State is required'),
  studentIdDocument: z.any().refine((file) => file instanceof File, 'Document is required')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), 'Only JPEG, PNG, and PDF files are allowed'),
  documentObjectKey: z.string().optional(),
  documentOriginalName: z.string().optional(),
  documentMimeType: z.string().optional(),
  documentSize: z.number().optional(),
  additionalInfo: z.string().optional(),
  consentPrivacy: z.boolean().refine((val) => val === true, 'You must consent to the privacy policy'),
  consentTerms: z.boolean().refine((val) => val === true, 'You must agree to the registration terms'),
});

// Industry professional registration schema
export const industryRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  jobTitle: z.string().min(2, 'Job title is required'),
  companyName: z.string().min(2, 'Company name is required'),
  industryType: z.string().min(2, 'Industry type is required'),
  department: z.string().min(2, 'Department is required'),
  yearsOfExperience: z.number().int().min(0).max(50),
  country: z.string().min(2, 'Country is required'),
  state: z.string().min(2, 'State is required'),
  professionalDocument: z.any().refine((file) => file instanceof File, 'Document is required')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), 'Only JPEG, PNG, and PDF files are allowed'),
  documentObjectKey: z.string().optional(),
  documentOriginalName: z.string().optional(),
  documentMimeType: z.string().optional(),
  documentSize: z.number().optional(),
  additionalInfo: z.string().optional(),
  consentPrivacy: z.boolean().refine((val) => val === true, 'You must consent to the privacy policy'),
  consentTerms: z.boolean().refine((val) => val === true, 'You must agree to the registration terms'),
});

// Other participant registration schema
export const otherRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  participantCategory: z.string().min(2, 'Participant category is required'),
  occupation: z.string().min(2, 'Occupation is required'),
  organizationName: z.string().optional(),
  purposeOfAttending: z.string().min(10, 'Please provide more details about why you want to attend'),
  country: z.string().min(2, 'Country is required'),
  state: z.string().min(2, 'State is required'),
  supportingDocument: z.any().optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((file) => !file || ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type), 'Only JPEG, PNG, and PDF files are allowed'),
  documentObjectKey: z.string().optional(),
  documentOriginalName: z.string().optional(),
  documentMimeType: z.string().optional(),
  documentSize: z.number().optional(),
  additionalInfo: z.string().optional(),
  consentPrivacy: z.boolean().refine((val) => val === true, 'You must consent to the privacy policy'),
  consentTerms: z.boolean().refine((val) => val === true, 'You must agree to the registration terms'),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Admin settings schema
export const conferenceSettingsSchema = z.object({
  conferenceName: z.string().min(2, 'Conference name is required'),
  conferenceSubtitle: z.string().optional(),
  conferenceDate: z.string().min(1, 'Conference date is required'),
  conferenceVenue: z.string().min(2, 'Venue is required'),
  conferenceDescription: z.string().min(10, 'Description is required'),
  studentFee: z.number().min(0),
  industryFee: z.number().min(0),
  otherFee: z.number().min(0),
  studentPaymentLinkId: z.string().optional(),
  industryPaymentLinkId: z.string().optional(),
  otherPaymentLinkId: z.string().optional(),
  registrationOpen: z.boolean(),
  documentSizeLimit: z.number().min(1).max(20),
  allowedFileTypes: z.array(z.string()),
});

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;
export type IndustryRegistrationInput = z.infer<typeof industryRegistrationSchema>;
export type OtherRegistrationInput = z.infer<typeof otherRegistrationSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ConferenceSettingsInput = z.infer<typeof conferenceSettingsSchema>;
