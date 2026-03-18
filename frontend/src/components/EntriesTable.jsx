import React from 'react';
import EntryRow from './EntryRow.jsx';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Pencil, Trash2, Copy, Check, ShieldAlert, Key, Globe, FileText, Loader2 } from 'lucide-react';

/**
 * Displays vault entries with pagination and status messaging.
 * Includes a responsive card-view for mobile devices.
 */
const EntriesTable = ({
  entries,
  showPasswords,
  onTogglePassword,
  onEditEntry,
  onDeleteEntry,
  isLoadingEntries,
  entriesError,
  hasDEK,
  showingRange,
  entriesMeta,
  clampedPage,
  totalPages,
  onPrevPage,
  onNextPage,
}) => {
  const [copiedId, setCopiedId] = React.useState(null);

  const handleCopy = async (password, id) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Status Messages */}
      {(entriesError || isLoadingEntries || !hasDEK) && (
        <div className="px-5 py-4 rounded-2xl bg-gray-900/40 border border-gray-800 flex items-center gap-3 text-sm text-gray-400">
          {!hasDEK && <Loader2 className="animate-spin text-emerald-500" size={18} />}
          {!hasDEK && 'Unlocking vault storage...'}
          {hasDEK && isLoadingEntries && <Loader2 className="animate-spin text-blue-500" size={18} />}
          {hasDEK && isLoadingEntries && 'Refreshing entries...'}
          {hasDEK && entriesError && <ShieldAlert className="text-red-500" size={18} />}
          {hasDEK && entriesError && entriesError}
        </div>
      )}

      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-gray-950/80 border border-gray-900 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-900 text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <th className="px-6 py-5">Title</th>
                <th className="px-6 py-5">Identifier</th>
                <th className="px-5 py-5">Site</th>
                <th className="px-6 py-5">Password</th>
                <th className="px-6 py-5">Note</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  isPasswordVisible={!!showPasswords[entry.id]}
                  onTogglePassword={() => onTogglePassword(entry.id)}
                  onEdit={() => onEditEntry(entry)}
                  onDelete={() => onDeleteEntry(entry.id)}
                />
              ))}
              {!isLoadingEntries && entries.length === 0 && !entriesError && (
                <tr>
                  <td className="px-8 py-12 text-center text-gray-600 italic" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                        <Key size={32} className="opacity-10" />
                        <p>No storage items found. Click 'New Entry' to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {entries.map((entry) => {
           const isVisible = !!showPasswords[entry.id];
           const isCopied = copiedId === entry.id;

           return (
            <div key={entry.id} className="bg-gray-950 border border-gray-900 rounded-2xl p-5 space-y-5 shadow-lg active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center font-black text-white border border-white/5">
                            {entry.title[0]}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white truncate max-w-[150px]">{entry.title}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <Globe size={12} /> {entry.site}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => onEditEntry(entry)}
                            className="p-2.5 text-gray-500 hover:text-white bg-gray-900 rounded-lg"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => onDeleteEntry(entry.id)}
                            className="p-2.5 text-gray-500 hover:text-red-500 bg-gray-900 rounded-lg"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3.5 bg-black/40 p-4 rounded-xl border border-gray-900/50">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase tracking-widest">Identifier</span>
                        <span className="text-gray-300 font-medium">{entry.identifier}</span>
                    </div>
                    <div className="h-px bg-gray-900/50" />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Password</span>
                        <div className="flex items-center gap-2">
                             <span className="font-mono tracking-widest text-gray-100 text-sm">
                                {isVisible ? entry.password : '••••••••'}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => onTogglePassword(entry.id)}
                        className="flex-1 flex items-center justify-center gap-2 h-12 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl text-xs transition-colors"
                    >
                        {isVisible ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                    </button>
                    <button 
                        onClick={() => handleCopy(entry.password, entry.id)}
                        className={`flex-1 flex items-center justify-center gap-2 h-12 font-black rounded-xl text-xs transition-all ${
                            isCopied ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                        }`}
                    >
                        {isCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                </div>
                
                {entry.note && (
                    <div className="flex gap-2 items-start text-xs text-gray-600 bg-gray-900/20 p-3 rounded-lg border border-gray-900/30">
                        <FileText size={14} className="mt-0.5 shrink-0" />
                        <p>{entry.note}</p>
                    </div>
                )}
            </div>
           );
        })}

        {!isLoadingEntries && entries.length === 0 && !entriesError && (
            <div className="py-20 text-center text-gray-600 italic">
                No storage items found.
            </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-gray-500 mt-8 pt-4 border-t border-gray-900">
        <div className="font-medium text-center sm:text-left">
          Showing <span className="text-gray-100">{showingRange.start}-{showingRange.end}</span> of{' '}
          <span className="text-gray-100">{entriesMeta.totalEntries}</span> vaults
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={onPrevPage}
            className="w-10 h-10 sm:w-auto sm:px-4 flex items-center justify-center rounded-xl bg-gray-900 border border-gray-800 text-white hover:border-gray-600 transition-all disabled:opacity-20"
            disabled={clampedPage === 1 || isLoadingEntries || !entriesMeta.hasPrevPage}
            type="button"
          >
            Prev
          </button>
          <div className="px-4 py-2 rounded-xl bg-gray-900/40 text-xs font-bold uppercase tracking-widest border border-gray-900">
            {clampedPage} / {totalPages}
          </div>
          <button
            onClick={onNextPage}
            className="w-10 h-10 sm:w-auto sm:px-4 flex items-center justify-center rounded-xl bg-gray-900 border border-gray-800 text-white hover:border-gray-600 transition-all disabled:opacity-20"
            disabled={clampedPage === totalPages || isLoadingEntries || !entriesMeta.hasNextPage}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

EntriesTable.propTypes = {
  entries: PropTypes.array.isRequired,
  showPasswords: PropTypes.object.isRequired,
  onTogglePassword: PropTypes.func.isRequired,
  onEditEntry: PropTypes.func.isRequired,
  onDeleteEntry: PropTypes.func.isRequired,
  isLoadingEntries: PropTypes.bool.isRequired,
  entriesError: PropTypes.string,
  hasDEK: PropTypes.bool.isRequired,
  showingRange: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number,
  }).isRequired,
  entriesMeta: PropTypes.shape({
    totalEntries: PropTypes.number,
    hasPrevPage: PropTypes.bool,
    hasNextPage: PropTypes.bool,
  }).isRequired,
  clampedPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPrevPage: PropTypes.func.isRequired,
  onNextPage: PropTypes.func.isRequired,
};

export default EntriesTable;
