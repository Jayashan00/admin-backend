import api from './api';

// GET /api/v1/alerts/unresolved
export const getUnresolvedAlerts = () => {
  return api.get('/alerts/unresolved');
};

// ++ NEW FUNCTION: GET /api/v1/alerts/resolved ++
export const getResolvedAlerts = () => {
    return api.get('/alerts/resolved');
};


// POST /api/v1/alerts/{id}/resolve
export const resolveAlert = (alertId) => {
  return api.post(`/alerts/${alertId}/resolve`);
};