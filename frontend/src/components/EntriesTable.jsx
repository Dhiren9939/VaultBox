import React from 'react';
import EntryRow from './EntryRow.jsx';

/**
 * Displays vault entries with pagination and status messaging.
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
  return (
    <>
      <div className="bg-gray-950/80 border border-gray-900/80 rounded-2xl overflow-hidden">
        {(entriesError || isLoadingEntries || !hasDEK) && (
          <div className="px-6 py-4 border-b border-gray-900 text-sm text-gray-400">
            {!hasDEK && 'Unlocking your vault...'}
            {hasDEK && isLoadingEntries && 'Loading entries...'}
            {hasDEK && entriesError && entriesError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-900 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">
                  Identifier
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">
                  Password
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">
                  Actions
                </th>
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
              {!isLoadingEntries && entries.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={6}>
                    No entries yet. Create your first vault item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mt-4">
        <div>
          Showing {showingRange.start}-{showingRange.end} of{' '}
          {entriesMeta.totalEntries}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            className="px-3 py-1.5 rounded-md border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40"
            disabled={
              clampedPage === 1 || isLoadingEntries || !entriesMeta.hasPrevPage
            }
            type="button"
          >
            Prev
          </button>
          <span className="px-2">
            Page {clampedPage} of {totalPages}
          </span>
          <button
            onClick={onNextPage}
            className="px-3 py-1.5 rounded-md border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40"
            disabled={
              clampedPage === totalPages ||
              isLoadingEntries ||
              !entriesMeta.hasNextPage
            }
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default EntriesTable;

