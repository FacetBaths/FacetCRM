import mongoose from 'mongoose';

const { Schema } = mongoose;

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    caption: String,
    uploadedBy: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const costsSchema = new Schema(
  {
    materials: { type: Number, default: 0 },
    labor: { type: Number, default: 0 },
    processing: { type: Number, default: 0 },
    misc: { type: Number, default: 0 },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    contact: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    contractAmount: { type: Number, required: true, min: 0 },
    contractPDF: { type: String },
    workbookPDF: { type: String },
    assignedInstallers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['Demo', 'In Progress', 'Hung', 'Completed-Service', 'Completed-Funded', 'Closed'],
      default: 'Demo',
    },
    installStartDate: { type: Date },
    installEndDate: { type: Date },
    costs: costsSchema,
    priorCreditDeclines: { type: Number, default: 0 },
    photos: [photoSchema],
    notes: [String],
  },
  { timestamps: true }
);

projectSchema.index({ contact: 1 });
projectSchema.index({ status: 1 });

export const Project = mongoose.model('Project', projectSchema);
