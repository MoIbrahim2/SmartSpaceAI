const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  credits: {
    type: Number,
    default: 20,
    min: 0
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'fields.firstName'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'fields.lastName'],
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    dateOfBirth: {
      type: Date
    }
  },
  authentication: {
    email: {
      type: String,
      required: [true, 'fields.email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      select: false
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      required: [true, 'fields.provider'],
      default: 'local'
    },
    providerId: {
      type: String
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    },
    refreshToken: {
      type: String,
      select: false
    }
  },
  preferences: {
    theme: {
      type: String
    },
    language: {
      type: String
    },
    timezone: {
      type: String
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      if (ret.authentication) {
        delete ret.authentication.passwordHash;
        delete ret.authentication.refreshToken;
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform(doc, ret) {
      if (ret.authentication) {
        delete ret.authentication.passwordHash;
        delete ret.authentication.refreshToken;
      }
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook to hash password before saving to the DB
userSchema.pre('save', async function () {
  if (!this.isModified('authentication.passwordHash')) return;
  if (this.authentication.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    this.authentication.passwordHash = await bcrypt.hash(this.authentication.passwordHash, salt);
  }
});

// Method to compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.authentication || !this.authentication.passwordHash) {
    throw new Error('Password hash field must be selected to compare');
  }
  return bcrypt.compare(candidatePassword, this.authentication.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
