import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  sender: mongoose.Types.ObjectId;
  targetFolders: mongoose.Types.ObjectId[];
  targetGroups: mongoose.Types.ObjectId[];
  priority: 'normal' | 'urgent';
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetFolders: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],
  targetGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
