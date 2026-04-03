import mongoose from 'mongoose';

const userAppInstallSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  appId: { type: String, required: true },
  // Permissions the user has granted to this app
  grantedPermissions: [{
    type: String,
    enum: ['location', 'camera', 'microphone', 'contacts', 'storage', 'notifications', 'payments', 'identity'],
  }],
  installedAt: { type: Date, default: Date.now },
  lastOpenedAt: { type: Date, default: Date.now },
  openCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

userAppInstallSchema.index({ userId: 1 });
userAppInstallSchema.index({ appId: 1 });
userAppInstallSchema.index({ userId: 1, appId: 1 }, { unique: true });

export default mongoose.model('UserAppInstall', userAppInstallSchema);
