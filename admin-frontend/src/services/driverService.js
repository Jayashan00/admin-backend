import api from './api';

// GET /api/v1/drivers
export const getAllDrivers = () => {
  return api.get('/drivers');
};

// GET /api/v1/drivers/{id}
export const getDriverById = (id) => {
  return api.get(`/drivers/${id}`);
};

// POST /api/v1/drivers
export const createDriver = (driverData) => {
  return api.post('/drivers', driverData);
};

// PUT /api/v1/drivers/{id}
export const updateDriver = (id, driverData) => {
  return api.put(`/drivers/${id}`, driverData);
};

// DELETE /api/v1/drivers/{id}
export const deleteDriver = (id) => {
  return api.delete(`/drivers/${id}`);
};