import api from './api';

// POST /api/v1/ml/datasets/upload
export const uploadDataset = (file, description, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', description);

  return api.post('/ml/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important for file uploads
    },
    onUploadProgress // Pass progress callback to axios
  });
};

// GET /api/v1/ml/datasets
export const listDatasets = () => {
  return api.get('/ml/datasets');
};

// DELETE /api/v1/ml/datasets/{id}
export const deleteDataset = (id) => {
  return api.delete(`/ml/datasets/${id}`);
};

// POST /api/v1/ml/train
export const trainModel = (datasetId, modelType) => {
  if (!datasetId || !modelType) {
    return Promise.reject(new Error("Dataset ID and Model Type are required."));
  }
  return api.post('/ml/train', { datasetId, modelType });
};