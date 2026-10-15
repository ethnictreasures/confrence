import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const phoneSchema = z.string().regex(/^[+]?([\d\s-]){10,20}$/, 'Invalid phone number');
const allowedDocumentTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fileSchema = z.custom<FileList>(
    (value) =>
      typeof FileList !== 'undefined' &&
      value instanceof FileList &&
      value.length > 0,
    'Document is required'
  )
  .transform((files) => files[0])
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    'File size must be 5 MB or less'
  )
  .refine(
    (file) =>
      allowedDocumentTypes.includes(
        file.type as (typeof allowedDocumentTypes)[number]
      ),
    'Only JPEG, PNG, and PDF files are allowed'
  );
const consentSchema = {
  additionalInfo: z.string().optional(),
  consentPrivacy: z.boolean().refine((value) => value, 'You must consent to the privacy policy'),
  consentTerms: z.boolean().refine((value) => value, 'You must agree to the registration terms'),
};

const commonRegistrationFields = {
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: emailSchema,
  phone: phoneSchema,
  country: z.string().min(2, 'Country is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
};

const documentMetadataFields = {
  documentObjectKey: z.string().uuid(),
  documentOriginalName: z.string().min(1).max(255),
  documentMimeType: z.enum(allowedDocumentTypes),
  documentSize: z.number().int().positive().max(5 * 1024 * 1024),
};

const studentFields = {
  collegeName: z.string().min(2, 'College name is required').max(255),
  degreeProgram: z.string().min(2, 'Degree program is required').max(255),
  department: z.string().min(2, 'Department is required').max(255),
  currentYear: z.string().min(1, 'Current year is required').max(50),
  expectedGraduationYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 10),
};

const industryFields = {
  jobTitle: z.string().min(2, 'Job title is required').max(255),
  companyName: z.string().min(2, 'Company name is required').max(255),
  industryType: z.string().min(2, 'Industry type is required').max(100),
  department: z.string().min(2, 'Department is required').max(255),
  yearsOfExperience: z.number().int().min(0).max(50),
};

export const studentRegistrationSchema = z.object({
  ...commonRegistrationFields,
  ...studentFields,
  studentIdDocument: fileSchema,
  ...consentSchema,
});

export const industryRegistrationSchema = z.object({
  ...commonRegistrationFields,
  ...industryFields,
  professionalDocument: fileSchema,
  ...consentSchema,
});

const commonRegistrationApiFields = {
  ...commonRegistrationFields,
  ...documentMetadataFields,
  ...consentSchema,
};

export const studentRegistrationApiSchema = z.object({
  ...commonRegistrationApiFields,
  ...studentFields,
});

export const industryRegistrationApiSchema = z.object({
  ...commonRegistrationApiFields,
  ...industryFields,
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;
export type IndustryRegistrationInput = z.infer<typeof industryRegistrationSchema>;
export type StudentRegistrationApiInput = z.infer<typeof studentRegistrationApiSchema>;
export type IndustryRegistrationApiInput = z.infer<typeof industryRegistrationApiSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
