import mongoose from 'mongoose';

const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    userName: { type: String, required: true },
    action: { type: String, required: true },
  },
  { _id: false }
);

const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    phones: {
      type: [String],
      validate: v => Array.isArray(v) && v.length > 0,
      required: true,
    },
    emails: [String],
    leadSource: {
      type: String,
      required: true,
      enum: ['Angi', 'Website', 'Avira', 'Facebook', 'Home Show', 'Referral', 'Other'],
    },
    contactType: {
      type: String,
      required: true,
      enum: ['Residential', 'Commercial', 'Supplier'],
    },
    contactCategory: {
      type: String,
      enum: ['Lead', 'Prospect', 'Customer', 'Previous Customer'],
      default: 'Lead',
    },
    divisions: [
      {
        type: String,
        enum: ['Renovations', 'Radiance'],
        required: true,
      },
    ],
    notes: String,
    activityLog: [activityLogSchema],
  },
  { timestamps: true }
);

export const Contact = mongoose.model('Contact', contactSchema);
