import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  folder: mongoose.Types.ObjectId;
  type: 'academic' | 'placement' | 'sports' | 'cultural' | 'hostel' | 'general';
  members: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  avatar: string;
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  folder: { type: Schema.Types.ObjectId, ref: 'Folder' },
  type: { 
    type: String, 
    enum: ['academic', 'placement', 'sports', 'cultural', 'hostel', 'general'], 
    default: 'general' 
  },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

GroupSchema.index({ members: 1 });
GroupSchema.index({ folder: 1 });
GroupSchema.index({ createdAt: -1 });

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
