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
  ArrowRight,
  Loader2,
  RefreshCw,
  Menu,
  X,
  User,
  Lock,
} from 'lucide-react';
import {
  getVaultKey,
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
  decryptShardWithRSA,
  encryptString,
  generateKEK,
  base64ToBuffer,
  decryptDEK,
  decryptPrivateKey,
  bufferToBase64,
} from '../service/cryptoService';
import { useAuth } from '../context/AuthProvider.jsx';
import EntriesTable from '../components/EntriesTable.jsx';
import DeadDropInbox from '../components/DeadDropInbox.jsx';
import RecoveryTab from '../components/RecoveryTab.jsx';

const Dashboard = () => {
  const {
    accessToken,
    DEK,KEK,
    RKEK,
    user,
    setAccessToken,
    setUser,
    setKEK,
    setDEK,
    setRKEK,
    rsaPrivateKey,
    setRsaPrivateKey,
  } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('passwords');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const [isSendShardOpen, setIsSendShardOpen] = useState(false);
  const [sendShardEmail, setSendShardEmail] = useState('');
  const [sendShardRecipient, setSendShardRecipient] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [sendShardError, setSendShardError] = useState('');
  const [isSendingShard, setIsSendingShard] = useState(false);
  const [sendShardSuccess, setSendShardSuccess] = useState('');

  // Vault Unlock State
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const handleUnlockVault = async (e) => {
    e.preventDefault();
    if (!unlockPassword.trim()) return;

    setIsUnlocking(true);
    setUnlockError('');

    try {
      // 1. Get vault keys
      const { eDEK, reDEK, kSalt, rSalt, kIv, rIv } = await getVaultKey();

      // 2. Derive KEK and RKEK
      const kek = await generateKEK(unlockPassword, base64ToBuffer(kSalt));
      const rkek = await generateKEK(unlockPassword, base64ToBuffer(rSalt));

      // 3. Decrypt Master DEK
      const dek = await decryptDEK(
        kek,
        base64ToBuffer(eDEK),
        base64ToBuffer(kIv)
      );

      // 4. Decrypt RSA Private Key if it exists
      if (user.encryptedPrivateKey && user.rsaIv) {
        try {
          const rsaPrivKey = await decryptPrivateKey(
            user.encryptedPrivateKey,
            unlockPassword,
            kSalt, // Re-deriving KEK for RSA Storage
            user.rsaIv
          );
          setRsaPrivateKey(rsaPrivKey);
        } catch (rsaError) {
          // Keep vault accessible even if RSA key decryption fails.
          // Dead-drop/recovery actions can be re-established after key rotation.
          console.warn('RSA private key decryption failed during unlock.', rsaError);
          setRsaPrivateKey(null);
        }
      }

      // 5. Set in context
      setKEK(kek);
      setRKEK(rkek);
      setDEK(dek);

      setUnlockPassword('');
    } catch (err) {
      setUnlockError('Invalid password or failed to unlock vault.');
      console.error(err);
    } finally {
      setIsUnlocking(false);
    }
  };

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
      setSendShardError(err?.response?.data?.message || 'User not found.');
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
    try {
      const senderId = shard.senderId?._id || shard.senderId;

      // 1. Decrypt RSA encoded shard
      const rawShard = await decryptShardWithRSA(rsaPrivateKey, shard.shardStr);

      // 2. Re-encrypt with user's KEK
      const { encryptedString, iv } = await encryptString(KEK, rawShard);

      // 3. Store in Vault
      await acceptShardToVault(senderId, encryptedString, bufferToBase64(iv));

      // 4. Cleanup
      await removeDeadDropShard(shard._id);
      setDeadDropShards((prev) => prev.filter((s) => s._id !== shard._id));
    } catch (err) {
      console.error('Accept Shard Error:', err);
    }
  };

  const handleRejectShard = async (shard) => {
    await removeDeadDropShard(shard._id);
    setDeadDropShards((prev) => prev.filter((s) => s._id !== shard._id));
  };

  const NavContent = () => (
    <>
      <div className="text-2xl font-bold tracking-tighter mb-10 flex items-center gap-2 px-4 lg:px-0">
        <ShieldCheck className="w-8 h-8" /> VaultBox
      </div>

      <nav className="flex-1 space-y-1">
        {[
          { id: 'passwords', label: 'All Passwords', icon: LayoutDashboard },
          { id: 'dead-drops', label: 'Dead Drops', icon: Inbox },
          { id: 'recovery', label: 'Recovery Center', icon: KeyRound },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            isSeparator: true,
          },
        ].map((item) => (
          <React.Fragment key={item.id}>
            {item.isSeparator && (
              <div className="!mt-4 pt-4 border-t border-gray-800" />
            )}
            <button
              onClick={() => {
                setActiveSection(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeSection === item.id
                  ? 'bg-white text-black shadow-lg scale-[1.02]'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <button
        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-950/20 rounded-lg mt-auto transition-colors"
        onClick={handleLogout}
      >
        <LogOut size={20} /> Log Out
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-black to-gray-950 text-white font-sans overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-gray-900/80 flex-col p-6 fixed h-full bg-black/50 backdrop-blur-xl z-20">
        <NavContent />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-gray-950 border-r border-gray-900 z-50 p-6 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"
        >
          <X size={24} />
        </button>
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header - Mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-black/60 backdrop-blur-md border-b border-gray-900/80 p-4 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-400 hover:text-white bg-gray-900 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> VaultBox
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-500">
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 p-5 sm:p-8 lg:p-12 max-w-7xl mx-auto w-full">
          {/* Passwords Section */}
          {activeSection === 'passwords' && (
            <>
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    My Vault
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Manage and secure your digital credentials.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setModalError('');
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                >
                  <Plus size={20} />{' '}
                  <span className="sm:inline">New Entry</span>
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
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Dead Drops
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Manage incoming recovery shards from trusted peers.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchDeadDrops}
                    disabled={isLoadingDeadDrops}
                    className="flex items-center justify-center p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={20}
                      className={isLoadingDeadDrops ? 'animate-spin' : ''}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setSendShardError('');
                      setSendShardSuccess('');
                      setIsSendShardOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                  >
                    <Send size={18} />{' '}
                    <span className="sm:inline">Send Shard</span>
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

          {/* Recovery Section */}
          {activeSection === 'recovery' && <RecoveryTab user={user} />}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <>
              <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-400 mt-1">
                  Manage your account and security preferences.
                </p>
              </header>

              <div className="bg-gray-950 border border-gray-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 text-gray-600">
                  <Settings size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-200">Coming Soon</h2>
                <p className="text-gray-500 mt-2 max-w-sm">
                  Account settings and customization options will be available
                  in a future version of VaultBox.
                </p>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals and Overlays */}
      {/* (Keep modals mostly the same but ensure they are w-full max-w-md and p-4 on mobile) */}

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-950 border border-gray-900 w-full max-w-lg p-6 sm:p-10 rounded-3xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-8">
              {editingEntryId ? 'Edit Vault Entry' : 'New Vault Entry'}
            </h2>
            <div className="space-y-5">
              {modalError && (
                <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                  {modalError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3.5 focus:border-white outline-none transition-colors"
                    placeholder="e.g. Amazon"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Site
                  </label>
                  <input
                    type="text"
                    name="site"
                    value={formData.site}
                    onChange={handleFormChange}
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3.5 focus:border-white outline-none transition-colors"
                    placeholder="amazon.com"
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Identifier
                </label>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3.5 focus:border-white outline-none transition-colors"
                  placeholder="email or username"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3.5 focus:border-white outline-none transition-colors"
                  placeholder="********"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Additional Note
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleFormChange}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3.5 focus:border-white outline-none min-h-[100px] resize-none"
                  placeholder="Optional details..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-4 border border-gray-800 rounded-2xl hover:bg-gray-900 transition-colors font-bold text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={isSavingEntry || !DEK}
                  className="flex-1 px-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {!DEK
                    ? 'LOCKED'
                    : isSavingEntry
                      ? 'SAVING...'
                      : editingEntryId
                        ? 'UPDATE'
                        : 'CREATE ENTRY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Shard Modal */}
      {isSendShardOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-900 w-full max-w-lg p-6 sm:p-10 rounded-3xl shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={handleCloseSendShard}
              className="absolute top-6 right-6 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-2">Transfer Recovery Shard</h2>
            <p className="text-gray-500 text-sm mb-8">
              Send a cryptographic piece of your key to a trusted user.
            </p>

            <div className="space-y-6">
              {sendShardError && (
                <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                  {sendShardError}
                </div>
              )}
              {sendShardSuccess && (
                <div className="px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm">
                  {sendShardSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Search size={16} />
                    </div>
                    <input
                      type="email"
                      value={sendShardEmail}
                      onChange={(e) => setSendShardEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookupUser()}
                      className="w-full bg-black border border-gray-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-white outline-none transition-all group-hover:border-gray-700"
                      placeholder="Enter recipient email..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupUser}
                    disabled={isLookingUp}
                    className="px-6 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                  >
                    {isLookingUp ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>

                {sendShardRecipient && (
                  <div className="border border-emerald-500/20 rounded-2xl p-5 bg-emerald-500/5 flex items-center gap-4 animate-in fade-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg border border-white/10">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white leading-tight">
                        {sendShardRecipient.firstName}{' '}
                        {sendShardRecipient.lastName}
                      </p>
                      <p className="text-xs text-emerald-400 font-medium mt-1 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck size={12} /> Public Key Found
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseSendShard}
                  className="flex-1 px-6 py-4 border border-gray-800 rounded-2xl hover:bg-gray-900 transition-colors font-bold text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendShard}
                  disabled={isSendingShard || !sendShardRecipient}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSendingShard ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSendingShard ? 'TRANSFERRING...' : 'TRANSFER SHARD'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Vault Unlock Overlay */}
      {!DEK && accessToken && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Unlock Vault
              </h1>
              <p className="text-gray-400">
                {user
                  ? 'Enter your Master Password to decrypt your vault and keys.'
                  : 'Preparing your secure session...'}
              </p>
            </div>

            <form onSubmit={handleUnlockVault} className="space-y-5">
              {unlockError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {unlockError}
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-sm font-medium text-gray-400 ml-1">
                  Master Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none transition-all placeholder-gray-600 text-white focus:ring-2 focus:ring-white/20 focus:border-white/20"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUnlocking || !user}
                className="w-full py-4 px-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xl shadow-white/5"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    UNLOCKING...
                  </>
                ) : !user ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    LOADING PROFILE...
                  </>
                ) : (
                  <>
                    UNLOCK VAULT
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Log out of {user.email}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
