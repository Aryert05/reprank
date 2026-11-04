import express from 'express';
import mongoose from 'mongoose';
import Workout from '../models/Workout.js';
import { requireDatabase } from '../middleware/databaseMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireDatabase);
router.use(authMiddleware);

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route   POST /api/workouts
// @desc    Create a new workout document for the authenticated user
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, exercise, sets, reps, weight, category, completed, sessionId } = req.body;

    if (!name || !exercise || sets === undefined || reps === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: name, exercise, sets, and reps are required',
      });
    }

    const isCompleted = completed !== undefined ? Boolean(completed) : false;
    const sid = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;

    if (isCompleted && sid) {
      const existing = await Workout.findOne({ user: req.user.id, sessionId: sid, completed: true });
      if (existing) {
        const out = existing.toObject ? existing.toObject() : existing;
        return res.status(200).json({ ...out, created: false, duplicate: true });
      }
      try {
        const workout = await Workout.create({
          user: req.user.id,
          sessionId: sid,
          name,
          exercise,
          sets: Number(sets),
          reps: Number(reps),
          weight: weight !== undefined ? Number(weight) : 0,
          category: category || 'General',
          completed: true,
        });
        return res.status(201).json(workout);
      } catch (error) {
        if (error?.code === 11000) {
          const existing = await Workout.findOne({ user: req.user.id, sessionId: sid, completed: true });
          if (existing) {
            const out = existing.toObject ? existing.toObject() : existing;
            return res.status(200).json({ ...out, created: false, duplicate: true });
          }
        }
        throw error;
      }
    }

    const workout = await Workout.create({
      user: req.user.id,
      sessionId: sid || undefined,
      name,
      exercise,
      sets: Number(sets),
      reps: Number(reps),
      weight: weight !== undefined ? Number(weight) : 0,
      category: category || 'General',
      completed: isCompleted,
    });

    return res.status(201).json(workout);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/workouts
// @desc    Get all workout documents for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get a single workout by MongoDB ObjectId (owner only)
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Workout ID format' });
    }

    const workout = await Workout.findOne({ _id: id, user: req.user.id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update an existing workout by ID (owner only)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Workout ID format' });
    }

    const updatedWorkout = await Workout.findOneAndUpdate(
      { _id: id, user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.status(200).json(updatedWorkout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout by ID (owner only)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Workout ID format' });
    }

    const deletedWorkout = await Workout.findOneAndDelete({ _id: id, user: req.user.id });

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
