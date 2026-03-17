import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, Trash2, Copy, Check } from 'lucide-react';

/**
 * Renders a single vault entry row.
 * @param {{ entry: any, isPasswordVisible: boolean, onTogglePassword: () => void, onEdit: () => void, onDelete: () => void }} props
 */
const EntryRow = ({
  entry,
  isPasswordVisible,
  onTogglePassword,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

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
        <div className="flex items-center gap-3">
          <span className="font-mono tracking-widest text-gray-500">
            {isPasswordVisible ? entry.password : '********'}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onTogglePassword}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
              type="button"
            >
              {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded transition-colors ${
                copied
                  ? 'text-green-500 bg-green-500/10'
                  : 'text-gray-500 hover:text-white hover:bg-gray-800'
              }`}
              title="Copy Password"
              type="button"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-gray-400">
        <span className="block max-w-[240px] truncate">
          {entry.note || '-'}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
            title="Edit"
            onClick={onEdit}
            type="button"
          >
            <Pencil size={18} />
          </button>
          <button
            className="p-2 hover:bg-red-950/30 rounded-md text-gray-400 hover:text-red-500 transition-colors"
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
