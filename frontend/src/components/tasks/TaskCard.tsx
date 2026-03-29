import { Task } from '../../types/task';

interface TaskCardProps {
  task: Task;
  onToggle: (taskId: number) => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
}: TaskCardProps) {
  return (
    <li className="bg-white rounded-xl border border-zinc-200 px-4 py-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800"
                title="Use in chat: e.g. 'delete task 5' or 'complete task 5'"
              >
                ID {task.id}
              </span>
              <p
                className={`text-sm font-medium ${
                  task.completed
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-900'
                }`}
              >
                {task.title}
              </p>
            </div>

            {task.description && (
              <p
                className={`mt-1 text-sm ${
                  task.completed
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-500'
                }`}
              >
                {task.description}
              </p>
            )}

            <p className="mt-2 text-xs text-zinc-400">
              Updated {new Date(task.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition"
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
