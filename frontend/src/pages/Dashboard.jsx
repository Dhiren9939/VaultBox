import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck
} from "lucide-react";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [entries, setEntries] = useState([
    { id: 1, site: "GitHub", username: "dev_user", url: "github.com", category: "Work" },
    { id: 2, site: "Netflix", username: "kyle@example.com", url: "netflix.com", category: "Personal" },
  ]);

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-900 flex flex-col p-6">
        <div className="text-2xl font-bold tracking-tighter mb-10 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8" /> VaultBox
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white text-black rounded-lg font-medium transition-colors">
            <LayoutDashboard size={20} /> All Passwords
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-900 rounded-lg transition-colors">
            <Lock size={20} /> Private Vault
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-900 rounded-lg transition-colors">
            <Settings size={20} /> Settings
          </a>
        </nav>

        <button className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-950/20 rounded-lg mt-auto transition-colors">
          <LogOut size={20} /> Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">My Vault</h1>
            <p className="text-gray-400">Manage and secure your digital identity.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            <Plus size={20} /> New Entry
          </button>
        </header>

        {/* Search & Filter */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search your vault..." 
            className="w-full bg-gray-950 border border-gray-800 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        {/* Passwords Table */}
        <div className="bg-gray-950 border border-gray-900 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-900 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Site</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Password</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {entries.map((entry) => (
                <tr key={entry.id} className="group hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center font-bold text-xs">
                        {entry.site[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{entry.site}</div>
                        <div className="text-xs text-gray-500">{entry.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-300">{entry.username}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tracking-widest text-gray-500">
                        {showPasswords[entry.id] ? "p@ss123" : "••••••••"}
                      </span>
                      <button 
                        onClick={() => togglePasswordVisibility(entry.id)}
                        className="text-gray-500 hover:text-white"
                      >
                        {showPasswords[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white" title="Copy Password">
                        <Copy size={18} />
                      </button>
                      <button className="p-2 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white" title="Go to Website">
                        <ExternalLink size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-950/30 rounded-md text-gray-400 hover:text-red-500" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 w-full max-w-md p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Service Name</label>
                <input type="text" className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none" placeholder="e.g. Amazon" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Username/Email</label>
                <input type="text" className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none" placeholder="name@email.com" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Password</label>
                <input type="password" className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:border-white outline-none" placeholder="••••••••" />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Save Entry
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