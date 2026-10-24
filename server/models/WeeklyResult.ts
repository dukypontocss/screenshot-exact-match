import mongoose, { Document, Schema } from 'mongoose';

export interface IWeeklyResult extends Document {
  clientId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  leads: number;
  cpl: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyResultSchema = new Schema<IWeeklyResult>({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  leads: { type: Number, required: true, min: 0 },
  cpl: { type: Number, required: true, min: 0 },
  notes: { type: String, default: null },
}, {
  timestamps: true,
});

WeeklyResultSchema.index({ clientId: 1, periodStart: 1 }, { unique: true });
WeeklyResultSchema.index({ clientId: 1 });

export const WeeklyResult = mongoose.model<IWeeklyResult>('WeeklyResult', WeeklyResultSchema);