import mongoose, { Document, Schema } from 'mongoose';

export interface IManager extends Document {
  name: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ManagerSchema = new Schema<IManager>({
  name: { type: String, required: true, trim: true },
  archived: { type: Boolean, default: false },
}, {
  timestamps: true,
});

ManagerSchema.index({ name: 1 }, { unique: true });

export const Manager = mongoose.model<IManager>('Manager', ManagerSchema);