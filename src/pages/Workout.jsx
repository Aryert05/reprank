import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../hooks/useToast.js';
import { useWorkout } from '../hooks/useWorkout.js';
import { fetchWorkoutPlan, EXTRA_EXERCISE_POOL } from '../data/mockApi.js';

export default function Workout() {
  useDocumentTitle("Workout — RepRank");
  const { toasts, showToast } = useToast();

  // Experiment 3: global workout actions from WorkoutContext
  const { addCompletedSet, completeWorkout } = useWorkout();

  // useFetch — loads today's plan (simulated API call) before rendering the exercise cards.
  const { data: plan, loading } = useFetch(fetchWorkoutPlan, []);

  const [extraExercises, setExtraExercises] = useState([]);
  const [setOverrides, setSetOverrides] = useState({}); // key: `${exerciseId}-${setIndex}` -> bool
  const [sessionStatus, setSessionStatus] = useState('not-started'); // 'not-started' | 'in-progress' | 'done'
  const [poolIndex, setPoolIndex] = useState(0);

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

  function handleFinish() {
    const total = (plan?.length || 0) + extraExercises.length;
    setSessionStatus('done');
    // Experiment 3: mark workout as completed in global state
    completeWorkout();
    showToast(`Workout finished — ${total} exercises logged. +40 XP (demo).`);
  }

  const allExercises = [...(plan || []), ...extraExercises];

  return (
    <Layout nav="app" active="workout">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
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
          {loading
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
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
