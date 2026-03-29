import { useState, useEffect } from 'react';
import { CreateTaskRequest, Task } from '../../types/task';

interface TaskFormProps {
  userId: string;
  onSubmit: (taskData: CreateTaskRequest) => void;
  onCancel: () => void;
  initialData?: Task;
}

export default function TaskForm({
  userId,
  onSubmit,
  onCancel,
  initialData,
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (title.length > 255) {
      setError('Title must be 255 characters or less');
      return;
    }

    if (description.length > 1000) {
      setError('Description must be 1000 characters or less');
      return;
    }

    setError('');
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      user_id: userId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Finish dashboard UI"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional details about this task…"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow"
        >
          {initialData ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
