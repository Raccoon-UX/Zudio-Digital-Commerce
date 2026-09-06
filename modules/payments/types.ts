export interface RazorpayOrderResponseDTO {
  razorpayOrderId: string;
  orderId: string;
  orderNumber: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface VerifyPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}

export interface PaymentVerificationResultDTO {
  success: boolean;
  orderId: string;
  orderNumber: string;
  status: "PAID";
  verifiedAt: string;
  razorpayPaymentId: string;
}

export interface WebhookProcessingResult {
  received: boolean;
  event: string;
  orderId?: string;
  orderNumber?: string;
  paymentId?: string;
  status: "processed" | "already_processed" | "failed_recorded" | "ignored";
  message?: string;
}

