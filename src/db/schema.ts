import { pgTable, uuid, varchar, text, boolean, decimal, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationNumber: varchar('registration_number', { length: 20 }).notNull().unique(),
  registrationType: varchar('registration_type', { length: 50 }).notNull().$type<'student' | 'industry_professional' | 'other'>(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }),
  state: varchar('state', { length: 100 }),
  
  // Student-specific fields
  collegeName: varchar('college_name', { length: 255 }),
  degreeProgram: varchar('degree_program', { length: 255 }),
  department: varchar('department', { length: 255 }),
  currentYear: varchar('current_year', { length: 50 }),
  expectedGraduationYear: integer('expected_graduation_year'),
  
  // Industry-specific fields
  jobTitle: varchar('job_title', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  industryType: varchar('industry_type', { length: 100 }),
  yearsOfExperience: integer('years_of_experience'),
  
  // Other participant fields
  participantCategory: varchar('participant_category', { length: 100 }),
  occupation: varchar('occupation', { length: 255 }),
  organizationName: varchar('organization_name', { length: 255 }),
  purposeOfAttending: text('purpose_of_attending'),
  
  // Document fields
  documentObjectKey: varchar('document_object_key', { length: 500 }),
  documentOriginalName: varchar('document_original_name', { length: 255 }),
  documentMimeType: varchar('document_mime_type', { length: 100 }),
  documentSize: integer('document_size'),
  
  // Status fields
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('pending').$type<'pending' | 'approved' | 'rejected' | 'additional_info_required'>(),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending').$type<'pending' | 'paid' | 'partially_paid' | 'failed' | 'expired' | 'cancelled' | 'partially_refunded' | 'refunded' | 'requires_reconciliation'>(),
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }),
  baseFeePaise: integer('base_fee_paise'),
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }),
  gstAmountPaise: integer('gst_amount_paise'),
  totalAmountPaise: integer('total_amount_paise'),
  currency: varchar('currency', { length: 3 }).default('INR'),
  paymentLinkId: varchar('payment_link_id', { length: 255 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }),
  paymentReconciliationStatus: varchar('payment_reconciliation_status', { length: 30 }).notNull().default('pending').$type<'pending' | 'matched' | 'requires_reconciliation'>(),
  amountPaidPaise: integer('amount_paid_paise').notNull().default(0),
  paymentCompletedAt: timestamp('payment_completed_at'),
  
  // Additional fields
  additionalInfo: text('additional_info'),
  consentPrivacy: boolean('consent_privacy').notNull().default(false),
  consentTerms: boolean('consent_terms').notNull().default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('idx_registrations_email').on(table.email),
  phoneIdx: index('idx_registrations_phone').on(table.phone),
  typeIdx: index('idx_registrations_type').on(table.registrationType),
  verificationStatusIdx: index('idx_registrations_verification_status').on(table.verificationStatus),
  paymentStatusIdx: index('idx_registrations_payment_status').on(table.paymentStatus),
  createdAtIdx: index('idx_registrations_created_at').on(table.createdAt),
}));

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id').notNull().references(() => registrations.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull().default('razorpay'),
  paymentLinkId: varchar('payment_link_id', { length: 255 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }).unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  amountPaise: integer('amount_paise'),
  currency: varchar('currency', { length: 3 }).default('INR'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().$type<'pending' | 'paid' | 'partially_paid' | 'failed' | 'expired' | 'cancelled' | 'partially_refunded' | 'refunded' | 'requires_reconciliation'>(),
  refundedAmountPaise: integer('refunded_amount_paise').notNull().default(0),
  webhookEventId: varchar('webhook_event_id', { length: 255 }).unique(),
  rawWebhookData: jsonb('raw_webhook_data'),
  
  // Timestamps
  paymentCreatedAt: timestamp('payment_created_at'),
  paymentCompletedAt: timestamp('payment_completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  registrationIdIdx: index('idx_payments_registration_id').on(table.registrationId),
  razorpayPaymentIdIdx: index('idx_payments_razorpay_payment_id').on(table.razorpayPaymentId),
  webhookEventIdIdx: index('idx_payments_webhook_event_id').on(table.webhookEventId),
  paymentStatusIdx: index('idx_payments_payment_status').on(table.paymentStatus),
}));

export const paymentRefunds = pgTable('payment_refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  razorpayRefundId: varchar('razorpay_refund_id', { length: 255 }).notNull().unique(),
  amountPaise: integer('amount_paise').notNull(),
  status: varchar('status', { length: 20 }).notNull().$type<'pending' | 'processed' | 'failed'>(),
  webhookEventId: varchar('webhook_event_id', { length: 255 }).notNull().unique(),
  rawEvent: jsonb('raw_event').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  paymentIdIdx: index('idx_payment_refunds_payment_id').on(table.paymentId),
}));

export type AdminRole = 'admin' | 'super_admin';

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin').$type<AdminRole>(),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('idx_admins_email').on(table.email),
}));

export const paymentWebhookEvents = pgTable('payment_webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookEventId: varchar('webhook_event_id', { length: 255 }).notNull().unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  paymentLinkId: varchar('payment_link_id', { length: 255 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }),
  amountPaise: integer('amount_paise'),
  currency: varchar('currency', { length: 3 }),
  payerEmail: varchar('payer_email', { length: 255 }),
  payerPhone: varchar('payer_phone', { length: 30 }),
  registrationId: uuid('registration_id').references(() => registrations.id, { onDelete: 'set null' }),
  reconciliationStatus: varchar('reconciliation_status', { length: 30 }).notNull().default('unresolved').$type<'unresolved' | 'matched' | 'manual' | 'ignored'>(),
  reconciliationReason: text('reconciliation_reason'),
  reconciledBy: uuid('reconciled_by').references(() => admins.id, { onDelete: 'set null' }),
  reconciledAt: timestamp('reconciled_at'),
  rawEvent: jsonb('raw_event').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  paymentIdIdx: index('idx_payment_webhook_events_payment_id').on(table.razorpayPaymentId),
  reconciliationStatusIdx: index('idx_payment_webhook_events_reconciliation_status').on(table.reconciliationStatus),
  registrationIdIdx: index('idx_payment_webhook_events_registration_id').on(table.registrationId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'set null' }),
  registrationId: uuid('registration_id').references(() => registrations.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  reason: text('reason'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  adminIdIdx: index('idx_audit_logs_admin_id').on(table.adminId),
  registrationIdIdx: index('idx_audit_logs_registration_id').on(table.registrationId),
  actionIdx: index('idx_audit_logs_action').on(table.action),
  createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
}));

export const conferenceSettings = pgTable('conference_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => admins.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keyIdx: index('idx_conference_settings_key').on(table.key),
}));
