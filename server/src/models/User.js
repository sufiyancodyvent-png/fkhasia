import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const employeeProfileSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, trim: true },
    department: { type: String, trim: true, default: 'General' },
    designation: { type: String, trim: true, default: 'Team Member' },
    phone: { type: String, trim: true, default: '' },
    resumeUrl: { type: String, trim: true, default: '' },
    workMode: { type: String, enum: ['office', 'remote', 'hybrid'], default: 'office' },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'manager', 'supervisor', 'employee', 'gateway'], default: 'employee', index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    profile: { type: employeeProfileSchema, default: () => ({}) },
    lastLoginAt: Date,
  },
  { timestamps: true },
)

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export const User = mongoose.model('User', userSchema)
