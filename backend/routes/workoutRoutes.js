import express from 'express';
import mongoose from 'mongoose';
import Workout from '../models/Workout.js';

const router = express.Router();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route   POST /api/workouts
// @desc    Create a new workout document
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, exercise, sets, reps, weight, category, completed } = req.body;

    if (!name || !exercise || sets === undefined || reps === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: name, exercise, sets, and reps are required',
      });
    }

    const workout = await Workout.create({
      name,
      exercise,
      sets: Number(sets),
      reps: Number(reps),
      weight: weight !== undefined ? Number(weight) : 0,
      category: category || 'General',
      completed: completed !== undefined ? Boolean(completed) : false,
    });

    res.status(201).json(workout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/workouts
// @desc    Get all workout documents
// @access  Public
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 });
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get a single workout by MongoDB ObjectId
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Workout ID format' });
    }

    const workout = await Workout.findById(id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update an existing workout by ID
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Workout ID format' });
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json(updatedWorkout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout by ID
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Workout ID format' });
    }

    const deletedWorkout = await Workout.findByIdAndDelete(id);

    if (!deletedWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json({
      message: 'Workout deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
