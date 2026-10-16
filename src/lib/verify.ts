
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { fetchRazorpayPayment } from './razorpay';

async function main() {
  const paymentId = 'pay_ToUBYTt7YG7VFw';

  const payment = await fetchRazorpayPayment(paymentId);

  if (!payment) {
    console.error(
      'Payment lookup failed. Check the payment ID, API credentials, and Razorpay response.'
    );
    process.exitCode = 1;
    return;
  }

  console.log('Payment details:', {
    id: payment.id,
    status: payment.status,
    amountRupees: payment.amount / 100,
    currency: payment.currency,
    orderId: payment.order_id,
    captured: payment.captured,
  });
}

main().catch((error) => {
  console.error('Verification script failed:', error);
  process.exitCode = 1;
});
