import React from 'react';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

/**
 * Renders a single vault entry row.
 * @param {{ entry: any, isPasswordVisible: boolean, onTogglePassword: () => void, onDelete: () => void }} props
 */
const EntryRow = ({
  entry,
  isPasswordVisible,
  onTogglePassword,
  onEdit,
  onDelete,
}) => {
  return (
    <tr className="group hover:bg-gray-900/50 transition-colors">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center font-bold text-xs">
            {entry.title[0]}
          </div>
          <div>
            <div className="font-semibold">{entry.title}</div>
            <div className="text-xs text-gray-500">Entry</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-gray-300">{entry.identifier}</td>
      <td className="px-6 py-5 text-gray-300">{entry.site}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="font-mono tracking-widest text-gray-500">
            {isPasswordVisible ? entry.password : '********'}
          </span>
          <button
            onClick={onTogglePassword}
            className="text-gray-500 hover:text-white"
            type="button"
          >
            {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </td>
      <td className="px-6 py-5 text-gray-400">
        <span className="block max-w-[240px] truncate">
          {entry.note || '-'}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <button
            className="p-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white"
            title="Edit"
            onClick={onEdit}
            type="button"
          >
            <Pencil size={18} />
          </button>
          <button
            className="p-2 hover:bg-red-950/30 rounded-md text-gray-400 hover:text-red-500"
            title="Delete"
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EntryRow;
