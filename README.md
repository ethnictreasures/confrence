# Conference Registration and Payment Management System

A production-ready conference registration platform with document verification, online payments, and a comprehensive admin dashboard.

## Features

- **Public Registration**: Student and Industry Professional categories; historical Other records remain available in administration
- **Document Upload**: Secure document uploads to Cloudflare R2 with presigned URLs
- **Payment Integration**: Two fixed Razorpay Payment Links, signed webhook processing, and audited manual reconciliation
- **Admin Dashboard**: Comprehensive dashboard with analytics, registration management, and verification workflows
- **Secure Authentication**: Server-side admin authentication with NextAuth.js
- **Audit Logging**: Complete audit trail for all administrative actions
- **CSV Export**: Export registration data with filters

## Conference

- Organizer: JUST POLYMER SOLUTIONS
- Initiative: Chem Petchem Education Drive
- Programme: Virtual Industry Programme
- Title: Automotive Industry: The Materials & Mobility Revolution
- Dates: October 31 – November 1, 2026 (virtual)
- Fees: Student ₹1,300 + GST ₹234 = ₹1,534; Industry Professional ₹6,000 + GST ₹1,080 = ₹7,080

GST values are organizer-configured and are not tax advice. Confirm the applicable GST treatment with the organizer's accountant.

## Technology Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Razorpay Payment Links
- **Authentication**: NextAuth.js (Auth.js)
- **UI**: Tailwind CSS + custom components
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel-compatible

## Prerequisites

- Node.js 20.9.0 or higher
- npm or yarn
- Neon PostgreSQL account
- Cloudflare R2 account
- Razorpay account

## Local Setup

### 1. Clone and Install Dependencies

```bash
cd seminar
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your server-only credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host/database

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# NextAuth Configuration
AUTH_SECRET=your_auth_secret_generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
APP_BASE_URL=http://localhost:3000
```

### 3. Generate AUTH_SECRET

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

### 4. Database Setup

#### Create Neon Database

1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

#### Apply the Additive Payment Migration

Review `drizzle/0001_pricing_payment_reconciliation.sql`, then apply it to the existing Neon database with your normal migration procedure. It adds fee snapshots, refund rows, and unresolved webhook-event storage; it does not delete or rewrite existing registrations. Do not use `db:push` against production without reviewing its proposed changes.

#### Seed Admin User

```bash
npm run db:seed
```

The seed requires `ADMIN_SEED_EMAIL`, `ADMIN_SEED_NAME`, and a unique `ADMIN_SEED_PASSWORD` of at least 12 characters. It does not print the password and does not replace an existing account with the same email.

### 5. Cloudflare R2 Setup

#### Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create a new bucket (private)
3. Get your Account ID from the R2 overview page
4. Create API Token with R2 permissions
5. Add credentials to `.env`

#### Environment Variables

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
```

### 6. Razorpay Setup

#### Configure the Existing Fixed Payment Links

1. Sign up at [Razorpay](https://razorpay.com)
2. Confirm the existing Student Payment Link is ₹1,534 and the Industry Professional Payment Link is ₹7,080, both in INR and with partial payments disabled.
3. Set `STUDENT_RAZORPAY_PAYMENT_LINK_URL`, `STUDENT_RAZORPAY_PAYMENT_LINK_ID`, `PROFESSIONAL_RAZORPAY_PAYMENT_LINK_URL`, and `PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID` in the server environment. Use the real values from your Razorpay Dashboard; no IDs are committed.
4. The app fetches each Payment Link server-side and verifies its ID, hosted URL, amount, currency, and that partial payments are disabled. Expired or cancelled links are rejected. Because many participants share the same link, keep those two links open for repeated payments in the Razorpay Dashboard.

#### Configure Webhook

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Subscribe to `payment_link.paid`, `payment_link.partially_paid`, `payment_link.expired`, `payment_link.cancelled`, `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`, `refund.failed`, and `refund.speed_changed`
4. Copy the webhook secret

#### Environment Variables

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
STUDENT_RAZORPAY_PAYMENT_LINK_URL=https://rzp.io/rzp/replace_with_student_link
STUDENT_RAZORPAY_PAYMENT_LINK_ID=plink_replace_with_student_id
PROFESSIONAL_RAZORPAY_PAYMENT_LINK_URL=https://rzp.io/rzp/replace_with_professional_link
PROFESSIONAL_RAZORPAY_PAYMENT_LINK_ID=plink_replace_with_professional_id
```

### 7. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment to Vercel

### 1. Prepare for Deployment

Ensure all environment variables are set in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env` (except development-specific ones)
3. Update `NEXTAUTH_URL` and `APP_BASE_URL` to your production domain

### 2. Update Razorpay Webhook

After deployment, update your Razorpay webhook URL to:
```
https://your-production-domain.com/api/webhooks/razorpay
```

### 3. Deploy

```bash
npm run build
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Database Migrations

### Generate Migration

```bash
npm run db:generate
```

### Apply Migration

```bash
npm run db:migrate
```

### Push Schema (Development)

```bash
npm run db:push
```

### Database Studio

```bash
npm run db:studio
```

## Project Structure

```
seminar/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── register/      # Registration endpoints
│   │   │   ├── upload/        # Document upload
│   │   │   └── webhooks/      # Razorpay webhooks
│   │   └── register/          # Registration pages
│   ├── components/            # React components
│   │   ├── admin/             # Admin components
│   │   ├── forms/             # Registration forms
│   │   └── ui/                # UI components
│   ├── config/                # Configuration files
│   ├── db/                    # Database schema and seed
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── r2.ts              # Cloudflare R2 integration
│   │   ├── razorpay.ts        # Razorpay integration
│   │   ├── utils.ts           # General utilities
│   │   └── validation.ts      # Zod schemas
│   └── types/                 # TypeScript definitions
├── drizzle/                   # Drizzle migrations
├── drizzle.config.ts          # Drizzle configuration
├── ENV_EXAMPLE.txt            # Environment template
└── package.json
```

## API Endpoints

### Public APIs

- `POST /api/upload/presign` - Generate presigned upload URL
- `POST /api/register/student` - Submit student registration
- `POST /api/register/industry` - Submit industry registration
- `POST /api/webhooks/razorpay` - Razorpay webhook handler

### Admin APIs

- `GET/POST /api/auth/[...nextauth]` - NextAuth authentication

## Security Considerations

- All secrets are stored in environment variables
- Database credentials are never exposed to the client
- R2 bucket is private with presigned URLs
- Razorpay webhooks verify signatures
- Admin routes are protected with middleware
- Server-side validation on all inputs
- Rate limiting recommended for production

## Service Quotas and Restrictions

### Neon PostgreSQL (Free Tier)
- 0.5 GB storage
- 1 Project
- Branching included
- Suitable for development and small-scale production

### Cloudflare R2 (Free Tier)
- 10 GB storage per month
- 1 million Class A operations per month
- 10 million Class B operations per month
- No egress fees
- Suitable for moderate document storage

### Razorpay
- Payment Links: No additional cost
- Transaction fees apply (2% per transaction)
- Webhooks: Included
- Suitable for all scales

### Vercel (Hobby Tier)
- 100 GB bandwidth per month
- 6,000 minutes of execution per month
- Serverless functions
- Not suitable for commercial use (upgrade to Pro for production)

## Testing Checklist

### Registration Flow
- [ ] Landing page loads correctly
- [ ] Registration category selection works
- [ ] Student form validates correctly
- [ ] Industry form validates correctly
- [ ] Document upload shows progress
- [ ] Form submission creates registration record
- [ ] Registration number is generated

### Document Upload
- [ ] Presigned URL generation works
- [ ] File upload to R2 succeeds
- [ ] File type validation works
- [ ] File size validation works
- [ ] Invalid files are rejected

### Payment Flow
- [ ] Payment instruction page displays correctly
- [ ] Payment link redirects to Razorpay
- [ ] Payment completion updates status
- [ ] Webhook processes payment events
- [ ] Payment status check works
- [ ] Confirmation page shows correct status

### Admin Authentication
- [ ] Login page works
- [ ] Invalid credentials are rejected
- [ ] Valid credentials grant access
- [ ] Session persists across pages
- [ ] Logout works
- [ ] Protected routes redirect to login

### Admin Dashboard
- [ ] Dashboard statistics are accurate
- [ ] Registration list loads
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Registration detail view loads
- [ ] Document download works
- [ ] Verification actions work
- [ ] Settings page loads

### Webhook Processing
- [ ] Payment link paid event is processed
- [ ] Payment link failed event is processed
- [ ] Payment link expired event is processed
- [ ] Webhook signature verification works
- [ ] Idempotency prevents duplicate processing
- [ ] Retry handling works

### Mobile Responsiveness
- [ ] Landing page is responsive
- [ ] Registration forms are responsive
- [ ] Admin dashboard is responsive
- [ ] Tables scroll horizontally on mobile

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon project status
- Ensure IP whitelisting is configured (if required)

### R2 Upload Failures
- Verify R2 credentials are correct
- Check bucket exists and is accessible
- Ensure presigned URL expiration is sufficient

### Razorpay Webhook Failures
- Verify webhook secret matches
- Check webhook URL is publicly accessible
- Ensure signature verification is working

### Build Errors
- Ensure Node.js version is 20.9.0 or higher
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Support

For issues or questions, contact the conference organizer. Do not treat GST figures on this site as tax advice.

## License

Proprietary - All rights reserved.
