import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000', // Backend Node.js
    headers: { 'Content-Type': 'application/json' },
});

export const createAsset = (data) => api.post('/createAsset', data);
export const readAsset = (id) => api.get(`/readAsset/${id}`);
export const deleteAsset = (id) => api.delete(`/deleteAsset/${id}`);
export const updateAsset = (id, data) => api.put(`/updateAsset/${id}`, data);
export const getAllAssets = () => api.get('/getAllAssets');

export default api;
