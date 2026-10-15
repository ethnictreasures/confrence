# Testing Checklist

## Pre-Deployment Testing

### Environment Setup
- [ ] All environment variables are configured
- [ ] Database connection is working
- [ ] R2 credentials are valid
- [ ] Razorpay credentials are valid
- [ ] AUTH_SECRET is generated
- [ ] Database migrations are applied
- [ ] Admin user is seeded

### Registration Flow Testing

#### Landing Page
- [ ] Page loads without errors
- [ ] Conference information displays correctly
- [ ] Registration category cards are visible
- [ ] Clicking category cards navigates to correct forms
- [ ] Navigation bar links work
- [ ] Mobile responsive layout
- [ ] Footer displays correctly

#### Student Registration
- [ ] Form loads without errors
- [ ] All required fields are marked
- [ ] Full name validation works (min 2 characters)
- [ ] Email validation works (valid email format)
- [ ] Phone validation works (valid phone format)
- [ ] College name validation works
- [ ] Degree program validation works
- [ ] Department validation works
- [ ] Current year validation works
- [ ] Expected graduation year validation works
- [ ] Country and state validation works
- [ ] Document upload accepts valid files (JPEG, PNG, PDF)
- [ ] Document upload rejects invalid file types
- [ ] Document upload rejects files > 5MB
- [ ] Upload progress indicator shows
- [ ] Consent checkboxes are required
- [ ] Form submission creates registration record
- [ ] Registration number is generated and unique
- [ ] Success redirect to payment page works
- [ ] Error messages display correctly

#### Industry Professional Registration
- [ ] Form loads without errors
- [ ] All required fields are marked
- [ ] Personal information validation works
- [ ] Job title validation works
- [ ] Company name validation works
- [ ] Industry type validation works
- [ ] Department validation works
- [ ] Years of experience validation works (0-50)
- [ ] Professional document upload works
- [ ] Document validation works
- [ ] Form submission creates registration record
- [ ] Success redirect to payment page works

#### Other Participant Registration
- [ ] Form loads without errors
- [ ] All required fields are marked
- [ ] Participant category validation works
- [ ] Occupation validation works
- [ ] Purpose of attending validation works (min 10 characters)
- [ ] Organization name is optional
- [ ] Supporting document is optional
- [ ] Form submission works with and without document
- [ ] Success redirect to payment page works

### Document Upload Testing

#### Presigned URL Generation
- [ ] API endpoint accepts valid requests
- [ ] Returns valid presigned URL
- [ ] URL expires after configured time
- [ ] Rejects invalid content types
- [ ] Rejects requests without objectKey

#### File Upload to R2
- [ ] Upload succeeds with valid files
- [ ] Upload fails with invalid files
- [ ] File size is enforced server-side
- [ ] MIME type is validated server-side
- [ ] Object key is unique and unpredictable
- [ ] File metadata is stored correctly

### Payment Flow Testing

#### Payment Instruction Page
- [ ] Displays registration number
- [ ] Shows participant name
- [ ] Shows correct category
- [ ] Displays correct amount
- [ ] Payment link button works
- [ ] Redirects to Razorpay
- [ ] Back to home link works

#### Razorpay Integration
- [ ] Payment link opens correctly
- [ ] Payment page loads
- [ ] Payment processing works
- [ ] Payment success redirects back
- [ ] Payment failure is handled
- [ ] Payment expiration is handled

#### Webhook Processing
- [ ] Webhook endpoint accepts POST requests
- [ ] Signature verification works
- [ ] Invalid signatures are rejected
- [ ] `payment_link.paid` event updates registration
- [ ] `payment_link.failed` event updates registration
- [ ] `payment_link.expired` event updates registration
- [ ] Idempotency prevents duplicate processing
- [ ] Webhook retries are handled safely
- [ ] Payment records are created
- [ ] Registration payment status is updated
- [ ] Razorpay payment ID is stored

#### Payment Status Check
- [ ] Confirmation page loads correctly
- [ ] Shows correct payment status
- [ ] Shows correct verification status
- [ ] Displays payment amount
- [ ] Shows payment reference
- [ ] Refresh status button works
- [ ] Pending payment state displays correctly
- [ ] Paid state displays correctly
- [ ] Failed state displays correctly

### Admin Authentication Testing

#### Login Page
- [ ] Login page loads without errors
- [ ] Email validation works
- [ ] Password validation works (min 8 characters)
- [ ] Valid credentials log in successfully
- [ ] Invalid credentials show error
- [ ] Loading state displays during login
- [ ] Redirects to dashboard after login
- [ ] Back to home link works

#### Session Management
- [ ] Session persists across page refreshes
- [ ] Session expires after timeout
- [ ] Logout works correctly
- [ ] Logout redirects to login page
- [ ] Session cookie is HTTP-only
- [ ] Session cookie is SameSite

#### Protected Routes
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access admin pages
- [ ] Middleware protection works
- [ ] Login page redirects to dashboard if already logged in

### Admin Dashboard Testing

#### Dashboard Overview
- [ ] Dashboard loads without errors
- [ ] Statistics are accurate:
  - [ ] Total registrations
  - [ ] Student registrations
  - [ ] Industry registrations
  - [ ] Other registrations
  - [ ] Paid registrations
  - [ ] Pending payments
  - [ ] Failed payments
  - [ ] Pending verifications
  - [ ] Approved registrations
  - [ ] Rejected registrations
  - [ ] Total revenue
- [ ] Quick action buttons work
- [ ] View registrations link works
- [ ] Settings link works
- [ ] Recent activity section loads
- [ ] Mobile responsive layout

#### Registration Management
- [ ] Registration list loads
- [ ] Table displays correctly
- [ ] All columns show data
- [ ] Pagination works (if implemented)
- [ ] Search by name works
- [ ] Search by email works
- [ ] Search by phone works
- [ ] Search by registration number works
- [ ] Filter by category works
- [ ] Filter by payment status works
- [ ] Filter by verification status works
- [ ] Filter combinations work
- [ ] View button opens detail page
- [ ] Export CSV button works
- [ ] Empty state displays correctly
- [ ] Loading state displays

#### Registration Detail View
- [ ] Detail page loads without errors
- [ ] Participant information displays:
  - [ ] Full name
  - [ ] Email
  - [ ] Phone
  - [ ] Registration type
  - [ ] Country
  - [ ] State
- [ ] Category-specific information displays:
  - [ ] Student: college, degree, department, year, graduation
  - [ ] Industry: job title, company, industry, department, experience
  - [ ] Other: category, occupation, organization, purpose
- [ ] Document section displays:
  - [ ] Document name
  - [ ] Document type
  - [ ] Document size
  - [ ] Download button works
- [ ] Payment information displays:
  - [ ] Amount
  - [ ] Payment status
  - [ ] Payment ID
  - [ ] Payment link ID
- [ ] Verification actions work:
  - [ ] Approve button
  - [ ] Reject button
  - [ ] Request additional info button
- [ ] Registration details display:
  - [ ] Registration number
  - [ ] Registration date
  - [ ] Last updated date
- [ ] Audit history displays:
  - [ ] Action list shows
  - [ ] Timestamps are correct
  - [ ] Admin actions are logged
- [ ] Back button works
- [ ] Mobile responsive layout

#### Admin Settings
- [ ] Settings page loads without errors
- [ ] Conference information form works
- [ ] Registration fees form works
- [ ] Payment links form works
- [ ] Document settings form works
- [ ] Registration status toggle works
- [ ] Save button works
- [ ] Cancel button works
- [ ] Changes persist after save
- [ ] Back to dashboard link works

### Security Testing

#### Input Validation
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are blocked
- [ ] CSRF protection is active
- [ ] File upload exploits are blocked
- [ ] Command injection attempts are blocked

#### Authorization
- [ ] Unauthorized access to admin pages is blocked
- [ ] API endpoints are protected
- [ ] Document download requires authentication
- [ ] Admin actions require proper role

#### Data Protection
- [ ] Passwords are hashed
- [ ] Secrets are not exposed in client code
- [ ] Database credentials are secure
- [ ] R2 credentials are secure
- [ ] Razorpay credentials are secure
- [ ] Webhook secret is secure

### Error Handling

#### Client-Side Errors
- [ ] Form validation errors display clearly
- [ ] Network errors show user-friendly messages
- [ ] Upload errors show progress
- [ ] Payment errors are handled

#### Server-Side Errors
- [ ] 500 errors are logged
- [ ] 404 errors show appropriate pages
- [ ] 401 errors redirect to login
- [ ] 403 errors show access denied
- [ ] 429 errors show rate limit message

### Performance Testing

#### Load Testing
- [ ] Page load time is acceptable (< 3s)
- [ ] Form submission is responsive
- [ ] Database queries are optimized
- [ ] File upload is efficient
- [ ] Dashboard loads quickly

#### Concurrent Users
- [ ] Multiple registrations can be submitted
- [ ] Multiple admin users can work simultaneously
- [ ] Database handles concurrent transactions
- [ ] Webhook processing handles bursts

### Mobile Responsiveness

#### Layout
- [ ] Landing page works on mobile
- [ ] Registration forms work on mobile
- [ ] Admin dashboard works on mobile
- [ ] Tables scroll horizontally
- [ ] Buttons are tappable
- [ ] Forms are usable on mobile

#### Touch Targets
- [ ] Buttons have minimum 44px touch targets
- [ ] Form inputs are large enough
- [ ] Links are easy to tap

### Browser Compatibility

#### Modern Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Older Browsers
- [ ] Graceful degradation works
- [ ] Fallback messages display

### Accessibility

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Skip links work

#### Screen Readers
- [ ] Alt text is present on images
- [ ] Form labels are associated
- [ ] ARIA labels are used where needed
- [ ] Status announcements work

#### Color Contrast
- [ ] Text contrast meets WCAG AA
- [ ] Focus indicators are visible
- [ ] Error messages are distinguishable

### Deployment Testing

#### Vercel Deployment
- [ ] Build succeeds without errors
- [ ] Environment variables are set
- [ ] Database connection works in production
- [ ] R2 connection works in production
- [ ] Razorpay webhook URL is updated
- [ ] Domain is configured
- [ ] SSL certificate is valid
- [ ] Application loads in production

#### Post-Deployment
- [ ] Smoke test all major features
- [ ] Verify webhook endpoints are accessible
- [ ] Test payment flow end-to-end
- [ ] Verify admin authentication
- [ ] Check logs for errors
- [ ] Monitor performance

## Known Limitations

- CSV export functionality is implemented but requires API endpoint completion
- Charts for analytics are prepared but require Recharts component integration
- Email notifications are not implemented (can be added with Resend or similar)
- Document preview is download-only (preview requires additional implementation)
- Payment reconciliation requires manual action API implementation
- Advanced filtering (date ranges) requires additional UI components

## Post-Launch Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor database performance
- [ ] Track webhook success rate
- [ ] Monitor payment completion rate
- [ ] Track registration conversion
- [ ] Monitor storage usage (R2)
- [ ] Review audit logs regularly
- [ ] Set up alerts for critical failures
