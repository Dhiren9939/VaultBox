import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  getEntries,
  postEntries,
  putEntry,
  deleteEntry,
  logoutUser,
} from '../service/api';
import { decryptEntry, encryptEntry } from '../service/cryptoService';
import { useAuth } from '../context/AuthProvider.jsx';
import EntriesTable from '../components/EntriesTable.jsx';

const Dashboard = () => {
  const { DEK, setAccessToken, setUser, setKEK, setDEK } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [entries, setEntries] = useState([]);
  const [entriesMeta, setEntriesMeta] = useState({
    totalEntries: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [modalError, setModalError] = useState('');
  const [reloadEntriesKey, setReloadEntriesKey] = useState(0);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    identifier: '',
    password: '',
    note: '',
    site: '',
  });

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalPages = Math.max(1, entriesMeta.totalPages || 1);
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;

  const showingRange = useMemo(() => {
    if (!entriesMeta.totalEntries) {
      return { start: 0, end: 0 };
    }
    return {
      start: startIndex + 1,
      end: Math.min(startIndex + pageSize, entriesMeta.totalEntries),
    };
  }, [entriesMeta.totalEntries, startIndex, pageSize]);

  useEffect(() => {
    if (!DEK) {
      setEntries([]);
      setEntriesMeta({
        totalEntries: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
      return;
    }

    let isActive = true;
    const fetchEntries = async () => {
      setIsLoadingEntries(true);
      setEntriesError('');
      try {
        const data = await getEntries(clampedPage, pageSize);
        const decryptedEntries = await Promise.all(
          (data.entries || []).map(async (entry) => {
            const decrypted = await decryptEntry(
              DEK,
              entry.cipherText,
              entry.iv
            );
            return {
              id: entry._id,
              title: decrypted.title || '',
              identifier: decrypted.identifier || '',
              password: decrypted.password || '',
              note: decrypted.note || '',
              site: decrypted.site || '',
            };
          })
        );

        if (!isActive) return;
        setEntries(decryptedEntries);
        setEntriesMeta({
          totalEntries: data.totalEntries || 0,
          totalPages: data.totalPages || 1,
          hasNextPage: !!data.hasNextPage,
          hasPrevPage: !!data.hasPrevPage,
        });
        setCurrentPage(data.page || clampedPage);
      } catch (error) {
        if (!isActive) return;
        const message =
          error?.response?.data?.message || 'Failed to load vault entries.';
        setEntriesError(message);
      } finally {
        if (isActive) {
          setIsLoadingEntries(false);
        }
      }
    };

    fetchEntries();

    return () => {
      isActive = false;
    };
  }, [DEK, clampedPage, reloadEntriesKey]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      identifier: '',
      password: '',
      note: '',
      site: '',
    });
  };

  const handleCloseModal = () => {
    resetForm();
    setModalError('');
    setEditingEntryId(null);
    setIsModalOpen(false);
  };

  const handleSaveEntry = async () => {
    if (!DEK) {
      setModalError('Vault is locked. Please log in again.');
      return;
    }
    if (
      !formData.title ||
      !formData.identifier ||
      !formData.password ||
      !formData.site
    ) {
      setModalError('Title, identifier, password, and site are required.');
      return;
    }
    setIsSavingEntry(true);
    try {
      const { cipherText, iv } = await encryptEntry(DEK, formData);
      if (editingEntryId) {
        await putEntry(editingEntryId, cipherText, iv);
      } else {
        await postEntries(cipherText, iv);
      }
      handleCloseModal();
      setCurrentPage(1);
      setReloadEntriesKey((prev) => prev + 1);
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Failed to create entry.';
      setModalError(message);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleEditEntry = (entry) => {
    setFormData({
      title: entry.title || '',
      identifier: entry.identifier || '',
      password: entry.password || '',
      note: entry.note || '',
      site: entry.site || '',
    });
    setEditingEntryId(entry.id);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (entryId) => {
    if (!entryId) return;
    try {
      await deleteEntry(entryId);
      const shouldStepBack =
        entries.length === 1 && clampedPage > 1 && !entriesMeta.hasNextPage;
      if (shouldStepBack) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        return;
      }
      setReloadEntriesKey((prev) => prev + 1);
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Failed to delete entry.';
      setEntriesError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Ignore API failures and still clear local auth state.
    } finally {
      setAccessToken('');
      setUser(null);
      setKEK(null);
      setDEK(null);
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-black to-gray-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-900/80 flex-col p-6">
        <div className="text-2xl font-bold tracking-tighter mb-10 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8" /> VaultBox
        </div>

        <nav className="flex-1 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 bg-white text-black rounded-lg font-medium transition-colors"
          >
            <LayoutDashboard size={20} /> All Passwords
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-900 rounded-lg transition-colors"
          >
            <Settings size={20} /> Settings
          </a>
        </nav>

        <button
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-950/20 rounded-lg mt-auto transition-colors"
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={20} /> Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="flex items-center justify-between lg:hidden mb-6">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> VaultBox
          </div>
          <button
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Vault</h1>
            <p className="text-gray-400">
              Manage and secure your digital identity in one place.
            </p>
          </div>

          <button
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            <Plus size={20} /> New Entry
          </button>
        </header>

        {/* Passwords Table */}
        <EntriesTable
          entries={entries}
          showPasswords={showPasswords}
          onTogglePassword={togglePasswordVisibility}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          isLoadingEntries={isLoadingEntries}
          entriesError={entriesError}
          hasDEK={!!DEK}
          showingRange={showingRange}
          entriesMeta={entriesMeta}
          clampedPage={clampedPage}
          totalPages={totalPages}
          onPrevPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
        />
      </main>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 w-full max-w-md p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">
              {editingEntryId ? 'Edit Entry' : 'Create New Entry'}
            </h2>
            <div className="space-y-4">
              {modalError && (
                <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {modalError}
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none"
                  placeholder="e.g. Amazon"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Identifier (email/username)
                </label>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none"
                  placeholder="name@email.com"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Site</label>
                <input
                  type="text"
                  name="site"
                  value={formData.site}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none"
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none"
                  placeholder="********"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none min-h-[96px]"
                  placeholder="Optional note"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={isSavingEntry || !DEK}
                  className="flex-1 px-4 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {!DEK
                    ? 'Vault Locked'
                    : isSavingEntry
                      ? 'Saving...'
                      : editingEntryId
                        ? 'Update Entry'
                        : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
