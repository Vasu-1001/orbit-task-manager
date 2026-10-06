import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatRelativeDueDate } from '../../utils/date';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  const { tasks, toggleTaskStatus } = useTasks();

  // Filter tasks eligible for focus: non-completed, sorted by priority (urgent -> high -> medium -> low)
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const eligibleTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Focus Timer state (25 minutes Pomodoro default)
  const DEFAULT_SECONDS = 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSecondsLeft(DEFAULT_SECONDS);
      setIsTimerRunning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTask = eligibleTasks[currentIndex];

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteCurrent = async () => {
    if (!currentTask) return;
    await toggleTaskStatus(currentTask.id);
  };

  const handleNext = () => {
    if (currentIndex < eligibleTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top Controls: Close button & Mode indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-indigo-400">
        <Target className="w-5 h-5 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
          ORBIT Focus Mode
        </span>
      </div>

      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Exit Focus Mode"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Focus Console */}
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8 p-4">
        {/* Integrated Pomodoro / Focus Timer */}
        <div className="flex flex-col items-center space-y-3">
          <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-white drop-shadow-lg">
            {formatTimer(secondsLeft)}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTimerRunning ? 'Pause Session' : 'Start Focus Session'}</span>
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setSecondsLeft(DEFAULT_SECONDS);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Task Card */}
        {currentTask ? (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={currentTask.status} />
                <PriorityBadge priority={currentTask.priority} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Task {currentIndex + 1} of {eligibleTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {currentTask.title}
              </h2>
              {currentTask.description && (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {currentTask.description}
                </p>
              )}
            </div>

            {currentTask.due_date && (
              <div className="text-xs font-medium text-amber-400">
                Deadline: {formatRelativeDueDate(currentTask.due_date)}
              </div>
            )}

            {/* Task Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Task"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= eligibleTasks.length - 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Task"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleCompleteCurrent}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-sm"
              >
                Mark Complete & Advance
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">All Active Tasks Cleared!</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              You have no pending or in-progress tasks remaining. Excellent work maintaining complete focus.
            </p>
            <Button variant="secondary" onClick={onClose}>
              Return to Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
