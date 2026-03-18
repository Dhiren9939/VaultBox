import axios from 'axios';

const api = axios.create({
  withCredentials: true,
  baseURL: 'http://localhost:3000',
});

let getAccessToken = () => '';
let handleAccessTokenUpdate = null;

function setAccessTokenProvider(fn) {
  getAccessToken = typeof fn === 'function' ? fn : () => '';
}

function setAccessTokenUpdater(fn) {
  handleAccessTokenUpdate = typeof fn === 'function' ? fn : null;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await api.get('/api/auth/refresh');
        const newAccessToken =
          refreshResponse?.data?.details?.accessToken || '';

        if (newAccessToken) {
          if (handleAccessTokenUpdate) {
            handleAccessTokenUpdate(newAccessToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        if (handleAccessTokenUpdate) {
          handleAccessTokenUpdate('');
        }
      }
    }

    return Promise.reject(error);
  }
);

async function registerUser(body) {
  const response = await api.post('/api/auth/register', body);
  return response.data.details;
}

async function loginUser(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data.details;
}

async function logoutUser() {
  const response = await api.post('/api/auth/logout');
  return response.data.details;
}
async function getVaultKey() {
  const response = await api.get('/api/vaults/key');
  return response.data.details;
}

async function getEntries(page = 1, limit = 10) {
  const response = await api.get('/api/vaults/entries', {
    params: { page, limit },
  });
  return response.data.details;
}

async function postEntries(cipherText, eIv) {
  const response = await api.post('/api/vaults/entries', { cipherText, eIv });
  return response.data.details;
}

async function putEntry(entryId, cipherText, eIv) {
  const response = await api.put(`/api/vaults/entries/${entryId}`, {
    cipherText,
    eIv,
  });
  return response.data.details;
}

async function deleteEntry(entryId) {
  const response = await api.delete(`/api/vaults/entries/${entryId}`);
  return response.data.details;
}

// Recovery API
async function getMyTrustees() {
  const response = await api.get('/api/recovery/trustees');
  return response.data.details;
}

async function getMyTrustors() {
  const response = await api.get('/api/recovery/trustors');
  return response.data.details;
}

async function addTrustee(body) {
  const response = await api.post('/api/recovery/shards', body);
  return response.data.details;
}

async function acceptShard(shardId) {
  const response = await api.put(`/api/recovery/shards/${shardId}/accept`);
  return response.data.details;
}

async function revokeTrustee(shardId) {
  const response = await api.delete(`/api/recovery/shards/${shardId}`);
  return response.data.details;
}

async function initiateRecovery() {
  const response = await api.post('/api/recovery/initiate');
  return response.data.details;
}

async function getIncomingRequests() {
  const response = await api.get('/api/recovery/requests');
  return response.data.details;
}

async function getUserByEmail(email) {
  const response = await api.get('/api/users', { params: { email } });
  return response.data.details;
}

async function getUserProfile() {
  const response = await api.get('/api/users');
  return response.data.details;
}

async function getDeadDrops() {
  const response = await api.get('/api/dead-drops');
  return response.data.details;
}

async function postShardToDeadDrop(deadDropId, shardStr) {
  const response = await api.post(`/api/dead-drops/${deadDropId}`, {
    shardStr,
  });
  return response.data.details;
}

async function removeDeadDropShard(shardId) {
  const response = await api.delete(`/api/dead-drops/shards/${shardId}`);
  return response.data.details;
}

async function acceptShardToVault(senderId, shardStr, shardIv) {
  const response = await api.post('/api/vaults/shard', {
    senderId,
    shardStr,
    shardIv,
  });
  return response.data.details;
}

// Full Recovery Flow APIs
async function startRecovery(body) {
  const response = await api.post('/api/recovery/start', body);
  return response.data.details;
}

async function getRecoveryShards(recoveryId) {
  const response = await api.get(`/api/recovery/shards/${recoveryId}`);
  return response.data.details;
}

async function approveRecoveryRequest(recoveryId, encryptedShardStr) {
  const response = await api.post(`/api/recovery/approve/${recoveryId}`, {
    encryptedShardStr,
  });
  return response.data.details;
}

async function finalizeRecovery(body) {
  const response = await api.post('/api/recovery/complete', body);
  return response.data.details;
}

async function cancelRecovery(body) {
  const response = await api.post('/api/recovery/cancel', body);
  return response.data.details;
}

export {
  registerUser,
  loginUser,
  logoutUser,
  getVaultKey,
  getEntries,
  postEntries,
  putEntry,
  deleteEntry,
  getMyTrustees,
  getMyTrustors,
  addTrustee,
  acceptShard,
  revokeTrustee,
  initiateRecovery,
  getIncomingRequests,
  getUserByEmail,
  getUserProfile,
  getDeadDrops,
  postShardToDeadDrop,
  removeDeadDropShard,
  acceptShardToVault,
  startRecovery,
  getRecoveryShards,
  approveRecoveryRequest,
  finalizeRecovery,
  cancelRecovery,
  setAccessTokenProvider,
  setAccessTokenUpdater,
};
