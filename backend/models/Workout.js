import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
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

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
