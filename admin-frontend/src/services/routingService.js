import api from './api';

// POST /api/v1/routing/generate
// We send the ID of the truck that should take the route
export const generateRoute = (truckId) => {
  // Make sure truckId is not null or empty before sending
  if (!truckId) {
     return Promise.reject(new Error("Truck ID is required to generate a route."));
  }
  return api.post('/routing/generate', { truckId });
};