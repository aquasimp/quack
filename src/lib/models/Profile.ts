import mongoose, { Schema, Document } from 'mongoose';

export interface IProject {
  name: string;
  description: string;
  tech: string[];
  link: string;
}

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  branch: string;
  semester: number;
  cgpa: number;
  skills: string[];
  projects: IProject[];
  certifications: string[];
  extracurriculars: string[];
  resumeUrl: string;
  placementReadinessScore: number;
  bio: string;
  linkedin: string;
  github: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  branch: { type: String, default: '' },
  semester: { type: Number, default: 1 },
  cgpa: { type: Number, default: 0, min: 0, max: 10 },
  skills: [{ type: String }],
  projects: [{
    name: String,
    description: String,
    tech: [String],
    link: String,
  }],
  certifications: [{ type: String }],
  extracurriculars: [{ type: String }],
  resumeUrl: { type: String, default: '' },
  placementReadinessScore: { type: Number, default: 0, min: 0, max: 100 },
  bio: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
