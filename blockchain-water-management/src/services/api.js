import axios from 'axios';

const api = axios.create({
    baseURL: 'https://upgraded-orbit-w6xwj654xg9h55r9-3000.app.github.dev', // Backend Node.js
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.API_KEY || 'd573db25fbd0d8068abbfd1edc0823ae62355ab301df14d4b2f6d2a9d59771d2'},
});

export const createAsset = (data) => api.post('/createAsset', data);
export const readAsset = (id) => api.get(`/readAsset/${id}`);
export const deleteAsset = (id) => api.delete(`/deleteAsset/${id}`);
export const updateAsset = (id, data) => api.put(`/updateAsset/${id}`, data);
export const getAllAssets = () => api.get('/getAllAssets');

export default api;
