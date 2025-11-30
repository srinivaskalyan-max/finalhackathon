import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  resourceTitle: {
    type: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'card'],
    default: 'stripe'
  },
  stripePaymentIntentId: {
    type: String
  },
  stripeSessionId: {
    type: String
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  metadata: {
    type: Map,
    of: String
  },
  failureReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
