import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  icon: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  groups: mongoose.Types.ObjectId[];
  visibility: 'public' | 'private';
  createdAt: Date;
}

const FolderSchema = new Schema<IFolder>({
  name: { type: String, required: true },
  icon: { type: String, default: '📁' },
  description: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);
