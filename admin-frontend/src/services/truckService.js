import api from './api';

// This file will hold all API functions related to Trucks

// GET /api/v1/trucks
export const getAllTrucks = () => {
  return api.get('/trucks');
};

// GET /api/v1/trucks/{id}
export const getTruckById = (id) => {
  return api.get(`/trucks/${id}`);
};

// POST /api/v1/trucks
export const createTruck = (truckData) => {
  return api.post('/trucks', truckData);
};

// PUT /api/v1/trucks/{id}
export const updateTruck = (id, truckData) => {
  return api.put(`/trucks/${id}`, truckData);
};

// DELETE /api/v1/trucks/{id}
export const deleteTruck = (id) => {
  return api.delete(`/trucks/${id}`);
};