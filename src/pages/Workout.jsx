import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../hooks/useToast.js';
import { useWorkout } from '../hooks/useWorkout.js';
import { fetchWorkoutPlan, EXTRA_EXERCISE_POOL } from '../data/mockApi.js';
import {
  fetchWorkouts as fetchApiWorkouts,
  createWorkout as createApiWorkout,
  updateWorkout as updateApiWorkout,
  deleteWorkout as deleteApiWorkout,
} from '../services/api.js';

export default function Workout() {
  useDocumentTitle('Workout — RepRank');
  const { toasts, showToast } = useToast();

  // Experiment 3: global workout actions from WorkoutContext
  const { addCompletedSet, completeWorkout } = useWorkout();

  // Experiment 2/3: useFetch for loading today's plan
  const { data: plan, loading: planLoading } = useFetch(fetchWorkoutPlan, []);

  // Experiment 4: useFetch for loading MongoDB stored workouts via REST API (GET /api/workouts)
  const {
    data: dbWorkouts,
    loading: dbLoading,
    error: dbError,
    refetch: refetchDbWorkouts,
  } = useFetch(fetchApiWorkouts, []);

  const [extraExercises, setExtraExercises] = useState([]);
  const [setOverrides, setSetOverrides] = useState({}); // key: `${exerciseId}-${setIndex}` -> bool
  const [sessionStatus, setSessionStatus] = useState('not-started'); // 'not-started' | 'in-progress' | 'done'
  const [poolIndex, setPoolIndex] = useState(0);

  // Form state for creating a new workout in MongoDB
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Push Day',
    exercise: 'Incline Bench Press',
    sets: 3,
    reps: 10,
    weight: 40,
    category: 'Chest',
    completed: false,
  });

  function isDone(exerciseId, index, defaultDone) {
    const key = `${exerciseId}-${index}`;
    return key in setOverrides ? setOverrides[key] : defaultDone;
  }

  function toggleSet(exerciseId, index, defaultDone) {
    const key = `${exerciseId}-${index}`;
    const wasDone = isDone(exerciseId, index, defaultDone);
    setSetOverrides((prev) => ({ ...prev, [key]: !wasDone }));
    // Experiment 3: when a set transitions to done, increment the global completed sets
    if (!wasDone) {
      addCompletedSet();
    }
  }

  function handleStart() {
    if (sessionStatus !== 'not-started') return;
    setSessionStatus('in-progress');
    showToast('Workout started — log your sets as you go.');
  }

  function handleAddExercise() {
    const exercise = EXTRA_EXERCISE_POOL[poolIndex % EXTRA_EXERCISE_POOL.length];
    setPoolIndex((i) => i + 1);
    setExtraExercises((prev) => [...prev, { ...exercise, id: `extra-${prev.length}-${exercise.name}` }]);
    showToast(`${exercise.name} added to today's session.`);
  }

  async function handleFinish() {
    const total = (plan?.length || 0) + extraExercises.length;
    setSessionStatus('done');

    // Experiment 3: mark workout as completed in global state
    completeWorkout();

    // Experiment 4: Save session summary directly to MongoDB backend (POST /api/workouts)
    try {
      await createApiWorkout({
        name: 'Push Day Session',
        exercise: 'Completed Routine (' + total + ' exercises)',
        sets: 4,
        reps: 10,
        weight: 50,
        category: 'Upper Body',
        completed: true,
      });
      refetchDbWorkouts();
      showToast(`Workout finished & saved to MongoDB database! +40 XP.`);
    } catch (err) {
      showToast(`Workout finished (+40 XP). Note: ${err.message}`);
    }
  }

  // Handle Form Change for creating new backend workout
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  // Handle POST /api/workouts submit
  async function handleCreateWorkoutSubmit(e) {
    e.preventDefault();
    try {
      await createApiWorkout(formData);
      showToast(`Workout "${formData.name}" added to MongoDB database!`);
      setShowAddForm(false);
      refetchDbWorkouts();
    } catch (err) {
      showToast(`Error creating workout: ${err.message}`);
    }
  }

  // Handle PUT /api/workouts/:id (toggle completion status in MongoDB)
  async function handleToggleDbWorkout(workout) {
    try {
      const updated = await updateApiWorkout(workout._id, {
        completed: !workout.completed,
      });
      showToast(
        `Workout "${updated.name}" marked as ${updated.completed ? 'Completed' : 'Pending'} in DB.`
      );
      refetchDbWorkouts();
    } catch (err) {
      showToast(`Error updating workout: ${err.message}`);
    }
  }

  // Handle DELETE /api/workouts/:id
  async function handleDeleteDbWorkout(id) {
    try {
      await deleteApiWorkout(id);
      showToast('Workout deleted from MongoDB database.');
      refetchDbWorkouts();
    } catch (err) {
      showToast(`Error deleting workout: ${err.message}`);
    }
  }

  const allExercises = [...(plan || []), ...extraExercises];

  return (
    <Layout nav="app" active="workout">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ================= TODAY'S SESSION (EXPERIMENTS 1-3) ================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="stat-label">Today's session</p>
            <h1 className="mt-1 text-3xl font-semibold text-mist-100">Push Day — Upper Body</h1>
            <p className="mt-1 text-sm text-mist-400">{allExercises.length || 3} exercises · est. 45–55 min</p>
          </div>
          <span className={`badge ${sessionStatus === 'in-progress' ? 'badge-xp' : sessionStatus === 'done' ? 'badge-achievement' : ''}`}>
            {sessionStatus === 'not-started' ? 'Not started' : sessionStatus === 'in-progress' ? 'In progress' : 'Completed'}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleStart} disabled={sessionStatus !== 'not-started'} className="btn-primary disabled:opacity-70">
            {sessionStatus === 'not-started' ? 'Start Workout' : 'Workout In Progress'}
          </button>
          <button onClick={handleAddExercise} className="btn-secondary">+ Add Exercise</button>
          <button onClick={handleFinish} className="btn-secondary ml-auto">Finish Workout</button>
        </div>

        <div className="mt-8 space-y-4">
          {planLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="h-5 w-40 animate-pulse rounded bg-ink-700" />
                  <div className="mt-4 h-24 animate-pulse rounded bg-ink-800" />
                </div>
              ))
            : allExercises.map((ex) => (
                <div key={ex.id} className="card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-mist-100">{ex.name}</h3>
                    <span className="badge">{ex.tag}</span>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-mist-400">
                          <th className="pb-2 font-medium">Set</th>
                          <th className="pb-2 font-medium">Reps</th>
                          <th className="pb-2 font-medium">Weight</th>
                          <th className="pb-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody className="font-mono text-mist-100">
                        {ex.sets.map((set, i) => {
                          const done = isDone(ex.id, i, !!set.done);
                          return (
                            <tr key={i} className="border-t border-ink-700">
                              <td className="py-2">{i + 1}</td>
                              <td>{set.reps}</td>
                              <td>{set.weight}</td>
                              <td>
                                <button
                                  onClick={() => toggleSet(ex.id, i, !!set.done)}
                                  className={done ? 'text-volt' : 'text-mist-400'}
                                  aria-label={done ? 'Mark set as not done' : 'Mark set as done'}
                                >
                                  {done ? '●' : '○'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
        </div>

        {/* ================= EXPERIMENT 4: REST API & MONGODB INTEGRATION ================= */}
        <div className="mt-14 border-t border-ink-700 pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="badge badge-xp">Experiment 4 · REST API & MongoDB</span>
              <h2 className="mt-2 text-2xl font-bold text-mist-100">Saved Database Workouts</h2>
              <p className="mt-1 text-sm text-mist-400">
                Persistent workouts synchronized with MongoDB Mongoose REST API (`/api/workouts`).
              </p>
            </div>
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="btn-primary shrink-0 text-sm"
            >
              {showAddForm ? 'Cancel' : '+ Add Workout to Database'}
            </button>
          </div>

          {/* Form for POST /api/workouts */}
          {showAddForm && (
            <form onSubmit={handleCreateWorkoutSubmit} className="card mt-6 space-y-4 border border-volt/30">
              <h3 className="font-semibold text-mist-100 text-lg">Add New Workout Record</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Workout Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="field-input"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Exercise Name</label>
                  <input
                    type="text"
                    name="exercise"
                    value={formData.exercise}
                    onChange={handleFormChange}
                    className="field-input"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Sets</label>
                  <input
                    type="number"
                    name="sets"
                    value={formData.sets}
                    onChange={handleFormChange}
                    className="field-input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Reps</label>
                  <input
                    type="number"
                    name="reps"
                    value={formData.reps}
                    onChange={handleFormChange}
                    className="field-input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleFormChange}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="field-input"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="completed"
                  name="completed"
                  checked={formData.completed}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border-ink-600 bg-ink-800 text-volt focus:ring-volt"
                />
                <label htmlFor="completed" className="text-sm text-mist-300">Mark as Completed</label>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="submit" className="btn-primary text-sm">Submit POST /api/workouts</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          )}

          {/* Database Workouts List (GET /api/workouts) */}
          <div className="mt-6 space-y-4">
            {dbLoading ? (
              <div className="card text-center py-8">
                <div className="h-4 w-48 animate-pulse rounded bg-ink-700 mx-auto" />
                <p className="mt-2 text-sm text-mist-400">Loading database workouts from REST API...</p>
              </div>
            ) : dbError ? (
              <div className="card border-red-500/50 bg-red-500/10 text-center py-6">
                <p className="text-sm text-red-400 font-semibold">Failed to connect to MongoDB REST API</p>
                <p className="text-xs text-mist-400 mt-1">{dbError.message}</p>
              </div>
            ) : !dbWorkouts || dbWorkouts.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-mist-300">No workouts saved in MongoDB yet.</p>
                <p className="text-xs text-mist-400 mt-1">Click "+ Add Workout to Database" above to create your first record!</p>
              </div>
            ) : (
              dbWorkouts.map((w) => (
                <div key={w._id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-ink-700 hover:border-ink-600 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-mist-100">{w.name}</h3>
                      <span className={`badge ${w.completed ? 'badge-achievement' : ''}`}>
                        {w.completed ? 'Completed ✓' : 'Pending'}
                      </span>
                      <span className="badge">{w.category || 'General'}</span>
                    </div>
                    <p className="mt-1 text-sm text-mist-300">
                      <span className="font-medium text-volt-400">{w.exercise}</span> · {w.sets} sets × {w.reps} reps {w.weight ? `@ ${w.weight} kg` : ''}
                    </p>
                    <p className="mt-1 text-xs text-mist-400 font-mono">
                      ID: {w._id} · Created: {new Date(w.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleDbWorkout(w)}
                      className="btn-secondary !py-1.5 !px-3 text-xs"
                      title="Update workout completed status via PUT /api/workouts/:id"
                    >
                      {w.completed ? 'Mark Pending' : 'Mark Done'}
                    </button>
                    <button
                      onClick={() => handleDeleteDbWorkout(w._id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                      title="Delete workout via DELETE /api/workouts/:id"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
