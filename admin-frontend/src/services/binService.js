import api from './api';

// This file will hold all API functions related to Bins

// GET /api/v1/bins
export const getAllBins = () => {
  return api.get('/bins');
};

// GET /api/v1/bins/{id}
export const getBinById = (id) => {
  return api.get(`/bins/${id}`);
};

// POST /api/v1/bins
export const createBin = (binData) => {
  return api.post('/bins', binData);
};

// PUT /api/v1/bins/{id}
export const updateBin = (id, binData) => {
  return api.put(`/bins/${id}`, binData);
};

// DELETE /api/v1/bins/{id}
export const deleteBin = (id) => {
  return api.delete(`/bins/${id}`);
};