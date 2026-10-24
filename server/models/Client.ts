import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  managerId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date | null;
  notes: string | null;
  archived: boolean;
  dot: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  managerId: { type: Schema.Types.ObjectId, ref: 'Manager', required: true },
  name: { type: String, required: true, trim: true },
  startDate: { type: Date, default: null },
  notes: { type: String, default: null },
  archived: { type: Boolean, default: false },
  dot: { type: String, default: '' },
}, {
  timestamps: true,
});

ClientSchema.index({ managerId: 1, name: 1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);