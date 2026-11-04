import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    sessionId: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Workout name is required'],
      trim: true,
    },
    exercise: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    sets: {
      type: Number,
      required: [true, 'Number of sets is required'],
      min: 1,
    },
    reps: {
      type: Number,
      required: [true, 'Number of reps is required'],
      min: 1,
    },
    weight: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

workoutSchema.index({ user: 1, createdAt: -1 });
workoutSchema.index({ user: 1, sessionId: 1 });

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
