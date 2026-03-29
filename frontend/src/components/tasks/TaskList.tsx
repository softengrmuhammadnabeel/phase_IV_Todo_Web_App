'use client';

import { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../types/task';

interface TaskListProps {
  userId: string;
  refreshKey?: number;
}

export default function TaskList({ userId, refreshKey }: TaskListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    tasks,
    loading,
    error,
    addTask,
    updateTaskById,
    toggleCompletion,
    removeTask,
    fetchTasks,
  } = useTasks();

  useEffect(() => {
    if (typeof refreshKey === 'number' && refreshKey > 0) {
      fetchTasks();
    }
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Your Tasks
          </h3>
          <p className="text-sm text-gray-500">
            Create, update and track your work. Each task shows an ID — in chat you can say e.g. &quot;delete task 5&quot; or &quot;complete task 5&quot;.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(prev => !prev);
            setEditingTask(null);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow"
        >
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Form */}
      {(showForm || editingTask) && (
        <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
          <TaskForm
            userId={userId}
            initialData={editingTask ?? undefined}
            onSubmit={async data => {
              if (editingTask) {
                await updateTaskById(editingTask.id, data);
                setEditingTask(null);
              } else {
                await addTask(data);
                setShowForm(false);
              }
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500 text-sm">
            No tasks yet. Start by adding your first task ✨
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleCompletion}
              onDelete={() => removeTask(task.id)}
              onEdit={() => {
                setEditingTask(task);
                setShowForm(false);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
