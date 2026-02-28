import mongoose, { Schema, model } from 'mongoose';
import { IPayment } from '@/types';

const paymentSchema = new Schema<IPayment>({
bookingId: {
type: String,
ref: 'Booking'
},
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String
  },
  merchantId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String
  },
  statusCode: {
    type: String
  },
  cardHolderName: {
    type: String
  },
  cardNo: {
    type: String
  },
  paymentData: {
  type: Schema.Types.Mixed
  },
  bookingData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Add indexes
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.models.Payment || model<IPayment>('Payment', paymentSchema);