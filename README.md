# Conference Registration and Payment Management System

A production-ready conference registration platform with document verification, online payments, and a comprehensive admin dashboard.

## Features

- **Public Registration**: Three registration categories (Student, Industry Professional, Other) with category-specific forms
- **Document Upload**: Secure document uploads to Cloudflare R2 with presigned URLs
- **Payment Integration**: Razorpay Payment Links integration with webhook processing
- **Admin Dashboard**: Comprehensive dashboard with analytics, registration management, and verification workflows
- **Secure Authentication**: Server-side admin authentication with NextAuth.js
- **Audit Logging**: Complete audit trail for all administrative actions
- **CSV Export**: Export registration data with filters

## Technology Stack

- **Framework**: Next.js 14+ with App Router
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

Copy the environment template and configure your credentials:

```bash
cp ENV_EXAMPLE.txt .env
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

#### Run Migrations

```bash
npm run db:push
```

This will create all required tables in your database.

#### Seed Admin User

```bash
npm run db:seed
```

Default admin credentials:
- Email: `admin@techconference2025.com`
- Password: `admin123`

**Important**: Change this password after first login!

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

#### Create Payment Links

1. Sign up at [Razorpay](https://razorpay.com)
2. Go to Payment Links → Create
3. Create separate links for each category (Student, Industry, Other)
4. Copy the Payment Link IDs

#### Configure Webhook

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events: `payment_link.paid`, `payment_link.failed`, `payment_link.expired`
4. Copy the webhook secret

#### Environment Variables

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
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
- `POST /api/register/other` - Submit other registration
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
- [ ] Other form validates correctly
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

For issues or questions:
- Email: support@techconference2025.com
- Check the documentation at the admin dashboard

## License

Proprietary - All rights reserved.
