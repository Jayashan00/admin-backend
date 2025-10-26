import api from './api';

// GET /api/v1/analytics/predict/bin/{binId}?hours={hours}
export const predictBinFillLevel = (binId, hours = 4) => {
  if (!binId) {
    return Promise.reject(new Error("Bin ID is required for prediction."));
  }
  return api.get(`/analytics/predict/bin/${binId}`, {
    params: { hours } // Send 'hours' as a query parameter
  });
};

// ++ NEW FUNCTION: POST /api/v1/analytics/train/bin/{binId} ++
export const trainBinModel = (binId) => {
    if (!binId) {
        return Promise.reject(new Error("Bin ID is required for training."));
    }
    return api.post(`/analytics/train/bin/${binId}`);
};

// Add functions for other analytics endpoints later