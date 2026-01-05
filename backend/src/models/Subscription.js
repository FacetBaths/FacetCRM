import mongoose from 'mongoose';

const { Schema } = mongoose;

const servicePhotoSchema = new Schema(
  {
    url: { type: String, required: true },
    caption: String,
  },
  { _id: false }
);

const serviceEntrySchema = new Schema(
  {
    date: { type: Date, required: true },
    serviceType: { type: String, required: true },
    notes: String,
    photos: [servicePhotoSchema],
  },
  { _id: false }
);

const subscriptionSchema = new Schema(
  {
    contact: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    tier: {
      type: String,
      enum: ['Glow', 'Brilliance', 'Eternal'],
      required: true,
    },
    monthlyPrice: { type: Number },
    annualPrice: { type: Number },
    billingCycle: {
      type: String,
      enum: ['Monthly', 'Annual'],
      required: true,
    },
    startDate: { type: Date, required: true },
    renewalDate: { type: Date },
    visitsRemaining: { type: Number, default: 0 },
    repairsCreditUsed: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          if (this.tier === 'Eternal') {
            return val <= 800;
          }
          return true;
        },
        message: 'repairsCreditUsed cannot exceed 800 for Eternal tier',
      },
    },
    lightsIncluded: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Cancelled', 'Expired'],
      default: 'Active',
    },
    serviceHistory: [serviceEntrySchema],
  },
  { timestamps: true }
);

const TIER_PRICING = {
  Glow: { monthly: 49, annual: 490 },
  Brilliance: { monthly: 79, annual: 790 },
  Eternal: { monthly: 119, annual: 990 },
};

subscriptionSchema.pre('save', function (next) {
  const pricing = TIER_PRICING[this.tier];
  if (pricing) {
    if (!this.monthlyPrice) this.monthlyPrice = pricing.monthly;
    if (!this.annualPrice) this.annualPrice = pricing.annual;
  }
  next();
});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
