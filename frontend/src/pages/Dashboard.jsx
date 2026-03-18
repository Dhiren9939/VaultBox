import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
  Inbox,
  KeyRound,
  Send,
  Search,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  getEntries,
  postEntries,
  putEntry,
  deleteEntry,
  logoutUser,
  getUserByEmail,
  getDeadDrops,
  postShardToDeadDrop,
  removeDeadDropShard,
  acceptShardToVault,
} from '../service/api';
import {
  decryptEntry,
  encryptEntry,
  generateShard,
  encryptShardWithRSA,
} from '../service/cryptoService';
import { useAuth } from '../context/AuthProvider.jsx';
import EntriesTable from '../components/EntriesTable.jsx';
import DeadDropInbox from '../components/DeadDropInbox.jsx';

const Dashboard = () => {
  const {
    DEK,
    RKEK,
    user,
    setAccessToken,
    setUser,
    setKEK,
    setRKEK,
    setDEK,
  } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('passwords');
  const [deadDropShards, setDeadDropShards] = useState([]);
  const [isLoadingDeadDrops, setIsLoadingDeadDrops] = useState(false);
  const [deadDropError, setDeadDropError] = useState('');
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

  // --- Send Shard Modal state ---
  const [isSendShardOpen, setIsSendShardOpen] = useState(false);
  const [sendShardEmail, setSendShardEmail] = useState('');
  const [sendShardRecipient, setSendShardRecipient] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [sendShardError, setSendShardError] = useState('');
  const [isSendingShard, setIsSendingShard] = useState(false);
  const [sendShardSuccess, setSendShardSuccess] = useState('');

  // --- Dead Drop fetch ---
  const fetchDeadDrops = useCallback(async () => {
    setIsLoadingDeadDrops(true);
    setDeadDropError('');
    try {
      const data = await getDeadDrops();
      setDeadDropShards(data.shards || []);
    } catch (err) {
      setDeadDropError(
        err?.response?.data?.message || 'Failed to load dead drops.'
      );
    } finally {
      setIsLoadingDeadDrops(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'dead-drops') {
      fetchDeadDrops();
    }
  }, [activeSection, fetchDeadDrops]);

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
              entry.eIv
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
      const { cipherText, eIv } = await encryptEntry(DEK, formData);
      if (editingEntryId) {
        await putEntry(editingEntryId, cipherText, eIv);
      } else {
        await postEntries(cipherText, eIv);
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
      setRKEK(null);
      setDEK(null);
      navigate('/login');
    }
  };

  // --- Send Shard handlers ---
  const handleLookupUser = async () => {
    if (!sendShardEmail.trim()) {
      setSendShardError('Please enter an email.');
      return;
    }
    if (sendShardEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setSendShardError('You cannot send a recovery shard to yourself.');
      return;
    }
    setIsLookingUp(true);
    setSendShardError('');
    setSendShardRecipient(null);
    setSendShardSuccess('');
    try {
      const data = await getUserByEmail(sendShardEmail.trim());
      if (!data?.user) {
        setSendShardError('User not found.');
        return;
      }
      setSendShardRecipient(data.user);
    } catch (err) {
      setSendShardError(
        err?.response?.data?.message || 'User not found.'
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSendShard = async () => {
    if (!sendShardRecipient || !RKEK || !user) return;
    setIsSendingShard(true);
    setSendShardError('');
    setSendShardSuccess('');
    try {
      // 1. Generate the shard using Shamir's secret sharing
      const { shard } = generateShard(
        RKEK,
        sendShardRecipient.id,
        user.fAttributes || { a1: '', a2: '' }
      );

      // 2. Encrypt the shard with the recipient's RSA public key
      const encryptedShard = await encryptShardWithRSA(
        sendShardRecipient.publicKey,
        shard
      );

      // 3. Post to recipient's dead drop
      await postShardToDeadDrop(sendShardRecipient.deadDropId, encryptedShard);

      setSendShardSuccess(
        `Shard sent to ${sendShardRecipient.firstName} successfully!`
      );
      setSendShardRecipient(null);
      setSendShardEmail('');
    } catch (err) {
      setSendShardError(
        err?.response?.data?.message || 'Failed to send shard.'
      );
    } finally {
      setIsSendingShard(false);
    }
  };

  const handleCloseSendShard = () => {
    setIsSendShardOpen(false);
    setSendShardEmail('');
    setSendShardRecipient(null);
    setSendShardError('');
    setSendShardSuccess('');
  };

  // --- Accept / Reject shard handlers ---
  const handleAcceptShard = async (shard) => {
    // shard.senderId is populated, so its an object { _id, firstName, ... }
    const senderId = shard.senderId?._id || shard.senderId;
    await acceptShardToVault(senderId, shard.shardStr);
    await removeDeadDropShard(shard._id);
    setDeadDropShards((prev) => prev.filter((s) => s._id !== shard._id));
  };

  const handleRejectShard = async (shard) => {
    await removeDeadDropShard(shard._id);
    setDeadDropShards((prev) => prev.filter((s) => s._id !== shard._id));
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-black to-gray-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-900/80 flex-col p-6">
        <div className="text-2xl font-bold tracking-tighter mb-10 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8" /> VaultBox
        </div>

        <nav className="flex-1 space-y-1">
          <button
            type="button"
            onClick={() => setActiveSection('passwords')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'passwords'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-900'
            }`}
          >
            <LayoutDashboard size={20} /> All Passwords
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('dead-drops')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'dead-drops'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-900'
            }`}
          >
            <Inbox size={20} /> Dead Drops
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('recovery')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeSection === 'recovery'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-900'
            }`}
          >
            <KeyRound size={20} /> Recovery
          </button>

          <div className="!mt-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'settings'
                  ? 'bg-white text-black font-medium'
                  : 'text-gray-400 hover:bg-gray-900'
              }`}
            >
              <Settings size={20} /> Settings
            </button>
          </div>
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
        {/* Passwords Section */}
        {activeSection === 'passwords' && (
          <>
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
              onPrevPage={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
              onNextPage={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
            />
          </>
        )}

         {/* Dead Drops Section */}
        {activeSection === 'dead-drops' && (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Dead Drops</h1>
                <p className="text-gray-400">
                  Incoming recovery shards from other users. Accept to store in
                  your vault.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchDeadDrops}
                  disabled={isLoadingDeadDrops}
                  className="flex items-center justify-center p-2.5 sm:p-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-gray-700 transition-all active:scale-95 disabled:opacity-50"
                  title="Refresh Dead Drops"
                >
                  <RefreshCw size={20} className={isLoadingDeadDrops ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => {
                    setSendShardError('');
                    setSendShardSuccess('');
                    setIsSendShardOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-gray-200 transition-all active:scale-95 text-sm sm:text-base"
                >
                  <Send size={20} /> <span className="hidden sm:inline">Send Shard</span>
                </button>
              </div>
            </header>

            <DeadDropInbox
              shards={deadDropShards}
              isLoading={isLoadingDeadDrops}
              error={deadDropError}
              onAccept={handleAcceptShard}
              onReject={handleRejectShard}
            />
          </>
        )}

        {/* Recovery Section (Placeholder) */}
        {activeSection === 'recovery' && (
          <>
            <header className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold">Recovery</h1>
              <p className="text-gray-400">
                Manage your vault recovery shards.
              </p>
            </header>

            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <KeyRound className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">
                Coming Soon
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Recovery features will be available in a future update.
              </p>
            </div>
          </>
        )}

        {/* Settings Section (Placeholder) */}
        {activeSection === 'settings' && (
          <>
            <header className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
              <p className="text-gray-400">
                Manage your account preferences.
              </p>
            </header>

            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Settings className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">
                Coming Soon
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Account settings will be available in a future update.
              </p>
            </div>
          </>
        )}
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

      {/* Send Shard Modal */}
      {isSendShardOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 w-full max-w-md p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Send Recovery Shard</h2>
            <div className="space-y-4">
              {sendShardError && (
                <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {sendShardError}
                </div>
              )}
              {sendShardSuccess && (
                <div className="px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm">
                  {sendShardSuccess}
                </div>
              )}

              {/* Email lookup */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Recipient Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={sendShardEmail}
                    onChange={(e) => setSendShardEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupUser()}
                    className="flex-1 bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none"
                    placeholder="user@example.com"
                  />
                  <button
                    type="button"
                    onClick={handleLookupUser}
                    disabled={isLookingUp}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLookingUp ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Search size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Recipient preview */}
              {sendShardRecipient && (
                <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Recipient Found
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-sm text-white font-medium">
                      {sendShardRecipient.firstName}{' '}
                      {sendShardRecipient.lastName}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      ID: {sendShardRecipient.id}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      Dead Drop: {sendShardRecipient.deadDropId}
                    </p>
                    <p className="text-xs text-emerald-400 mt-1">
                      ✓ RSA public key available
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseSendShard}
                  className="flex-1 px-4 py-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendShard}
                  disabled={
                    isSendingShard || !sendShardRecipient || !RKEK || !user
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isSendingShard ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSendingShard ? 'Sending...' : 'Send Shard'}
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
