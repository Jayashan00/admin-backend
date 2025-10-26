import api from './api';

export const runSimulationTick = () => {
  return api.post('/simulation/tick');
};
