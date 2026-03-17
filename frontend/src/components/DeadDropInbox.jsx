import React, { useState } from 'react';
import {
  Inbox,
  User,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';

const DeadDropInbox = ({ shards, isLoading, error, onAccept, onReject }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAccept = async (shard) => {
    setProcessingId(shard._id);
    try {
      await onAccept(shard);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (shard) => {
    setProcessingId(shard._id);
    try {
      await onReject(shard);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading dead drops...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!shards || shards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <PackageOpen className="w-12 h-12 mb-4 text-gray-600" />
        <p className="text-lg font-medium text-gray-400">No shards yet</p>
        <p className="text-sm text-gray-600 mt-1">
          When someone sends you a recovery shard, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shards.map((shard) => {
        const isExpanded = expandedId === shard._id;
        const isProcessing = processingId === shard._id;

        return (
          <div
            key={shard._id}
            className="border border-gray-800 rounded-xl bg-gray-950/50 overflow-hidden transition-all hover:border-gray-700"
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => toggleExpand(shard._id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-900/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    From: {shard.senderId}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(shard.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Pending
                </span>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-500" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500" />
                )}
              </div>
            </button>

            {/* Expanded section */}
            {isExpanded && (
              <div className="px-5 pb-4 pt-1 border-t border-gray-800/60">
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Encrypted Shard Data
                  </p>
                  <div className="bg-black/50 border border-gray-800 rounded-lg p-3 max-h-24 overflow-auto">
                    <code className="text-xs text-gray-400 break-all font-mono leading-relaxed">
                      {shard.shardStr}
                    </code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAccept(shard)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(shard)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-700 hover:bg-red-950/30 hover:border-red-800 text-gray-300 hover:text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DeadDropInbox;
