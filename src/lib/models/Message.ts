import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  type: 'text' | 'announcement' | 'file';
  isPinned: boolean;
  iv: string;
  encrypted: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  type: { type: String, enum: ['text', 'announcement', 'file'], default: 'text' },
  isPinned: { type: Boolean, default: false },
  iv: { type: String, default: '' },
  encrypted: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ group: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
