import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Please select a resource type'],
    enum: ['Textbook', 'Research Paper', 'Study Guide', 'Lecture Notes', 'Video', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'Please provide a file URL']
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByName: {
    type: String,
    required: true
  },
  feedback: [feedbackSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate average rating
resourceSchema.methods.calculateAverageRating = function() {
  if (this.feedback.length === 0) {
    this.averageRating = 0;
  } else {
    const sum = this.feedback.reduce((acc, item) => acc + (item.rating || 0), 0);
    this.averageRating = sum / this.feedback.length;
  }
};

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
