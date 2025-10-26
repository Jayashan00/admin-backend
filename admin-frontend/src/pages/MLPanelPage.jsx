import React, { useState, useEffect } from 'react';
import { uploadDataset, listDatasets, deleteDataset, trainModel } from '../services/mlService';
import './MLPanelPage.css'; // Create this CSS file

function MLPanelPage() {
  // Datasets State
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasetError, setDatasetError] = useState('');

  // Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Training State
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedModelType, setSelectedModelType] = useState('BinFillForecasting'); // Example model type
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState('');
  const [trainError, setTrainError] = useState('');


  // Fetch datasets on mount
  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true);
      setDatasetError('');
      const response = await listDatasets();
      setDatasets(response.data || []);
      // Auto-select first dataset for training if available
      if (response.data && response.data.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(response.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching datasets:", err);
      setDatasetError("Could not load datasets.");
    } finally {
      setLoadingDatasets(false);
    }
  };
  useEffect(() => { fetchDatasets(); }, []); // Run once on mount


  // Upload Handlers
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadProgress(0); // Reset progress
    setUploadError('');
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      await uploadDataset(selectedFile, description, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      alert('Dataset uploaded successfully!');
      setSelectedFile(null); // Clear file input (might need ref for this)
      setDescription('');
      setUploadProgress(0);
      document.getElementById('fileInput').value = null; // Reset file input
      await fetchDatasets(); // Refresh list
    } catch (err) {
      console.error("Error uploading dataset:", err);
      setUploadError(err.response?.data?.message || "File upload failed.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Delete Handler
  const handleDeleteDataset = async (id, filename) => {
    if (window.confirm(`Are you sure you want to delete dataset "${filename}"?`)) {
       try {
            setLoadingDatasets(true); // Indicate loading
            await deleteDataset(id);
            alert('Dataset deleted successfully!');
            await fetchDatasets(); // Refresh list
       } catch(err) {
           console.error("Error deleting dataset:", err);
           setDatasetError("Failed to delete dataset.");
           setLoadingDatasets(false); // Ensure loading stops on error
       }
       // setLoadingDatasets is set to false by fetchDatasets on success
    }
  };

  // Training Handler
  const handleTrain = async (event) => {
      event.preventDefault();
      if (!selectedDatasetId) {
          setTrainError("Please select a dataset to train on.");
          return;
      }
      setTraining(true);
      setTrainError('');
      setTrainMessage('');

      try {
          const response = await trainModel(selectedDatasetId, selectedModelType);
          setTrainMessage(response.data?.message || "Training simulation started.");
          // Optionally refresh dataset list to show status change (e.g., "TRAINING")
           await fetchDatasets();
           // Keep showing message until next action
      } catch (err) {
           console.error("Error triggering training:", err);
           setTrainError(err.response?.data?.message || "Failed to trigger training.");
      } finally {
          setTraining(false);
      }
  };

   // Helper to format bytes
   const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
   }


  return (
    <div className="page-container ml-panel-page">
      <h2>Machine Learning Panel</h2>

      {/* --- Dataset Management Section --- */}
      <section className="ml-section">
        <h3>Dataset Management</h3>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="ml-form upload-form">
          <h4>Upload New Dataset (CSV)</h4>
          {uploadError && <p className="ml-error">{uploadError}</p>}
          <div className="form-group">
            <label htmlFor="fileInput">Choose File:</label>
            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              accept=".csv, text/csv" // Accept only CSV
              required
              disabled={uploading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description (Optional):</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Bin fill levels - Q3 2025"
              disabled={uploading}
            />
          </div>
          {/* Progress Bar */}
          {uploading && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}
          <button type="submit" disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </form>

        {/* Dataset List */}
        <div className="dataset-list">
          <h4>Available Datasets</h4>
          {datasetError && <p className="ml-error">{datasetError}</p>}
          {loadingDatasets && <p>Loading datasets...</p>}
          {!loadingDatasets && datasets.length === 0 && <p>No datasets uploaded yet.</p>}
          {!loadingDatasets && datasets.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map(ds => (
                  <tr key={ds.id}>
                    <td>{ds.filename}</td>
                    <td>{formatBytes(ds.size)}</td>
                    <td>{new Date(ds.uploadTimestamp).toLocaleDateString()}</td>
                    <td>{ds.description}</td>
                    <td>{ds.status}</td>
                    <td>
                      <button
                         className="btn-delete btn-small" // Add small class
                         onClick={() => handleDeleteDataset(ds.id, ds.filename)}
                         disabled={loadingDatasets} // Disable while list is loading
                      >
                         Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* --- Model Training Section --- */}
      <section className="ml-section">
        <h3>Model Training (Simulation)</h3>
        <form onSubmit={handleTrain} className="ml-form train-form">
           {trainError && <p className="ml-error">{trainError}</p>}
           {trainMessage && <p className="ml-message">{trainMessage}</p>}
          <div className="form-group">
              <label htmlFor="datasetSelectTrain">Select Dataset:</label>
              <select
                 id="datasetSelectTrain"
                 value={selectedDatasetId}
                 onChange={(e) => setSelectedDatasetId(e.target.value)}
                 disabled={training || loadingDatasets || datasets.length === 0}
               >
                 {loadingDatasets ? <option>Loading...</option> :
                  datasets.length === 0 ? <option value="" disabled>No datasets available</option> :
                  ( <>
                     <option value="" disabled>-- Select Dataset --</option>
                     {datasets.map(ds => (<option key={ds.id} value={ds.id}>{ds.filename}</option>))}
                    </>
                  )
                 }
               </select>
          </div>
           <div className="form-group">
               <label htmlFor="modelTypeSelect">Select Model Type:</label>
               <select
                  id="modelTypeSelect"
                  value={selectedModelType}
                  onChange={(e) => setSelectedModelType(e.target.value)}
                  disabled={training}
                >
                    {/* Add more model types later */}
                    <option value="BinFillForecasting">Bin Fill Forecasting</option>
                    <option value="RouteEfficiencyPrediction">Route Efficiency Prediction</option>
                </select>
           </div>
           <button type="submit" disabled={training || loadingDatasets || !selectedDatasetId}>
               {training ? 'Training...' : 'Start Training Simulation'}
           </button>
        </form>
      </section>

    </div>
  );
}

export default MLPanelPage;