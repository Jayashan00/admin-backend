import React, { useState, useEffect } from 'react';
import { getAllBins } from '../services/binService';
import { predictBinFillLevel, trainBinModel } from '../services/analyticsService'; // ++ Import trainBinModel ++
import './PredictionPage.css';

function PredictionPage() {
  const [bins, setBins] = useState([]);
  const [selectedBinId, setSelectedBinId] = useState('');
  const [predictionHours, setPredictionHours] = useState(4);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingBins, setLoadingBins] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [training, setTraining] = useState(false); // ++ State for training ++
  const [message, setMessage] = useState(''); // General status messages
  const [error, setError] = useState('');

  // Fetch bins for the dropdown
  useEffect(() => {
    const fetchBins = async () => { /* ... (no changes) ... */ };
    fetchBins();
  }, []);

  // Handle prediction request
  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedBinId) { setError("Please select a bin."); return; }
    setPredicting(true); setError(''); setMessage(''); setPredictionResult(null);
    try {
      const response = await predictBinFillLevel(selectedBinId, predictionHours);
      setPredictionResult(response.data);
      setMessage(`Prediction successful for ${predictionHours} hours ahead.`); // Add success message
    } catch (err) {
      console.error("Error predicting fill level:", err);
      setError(err.response?.data?.message || "Prediction failed. Train model or try again."); // Update error message
    } finally {
      setPredicting(false);
    }
  };

  // ++ Handle Training Trigger ++
  const handleTrain = async () => {
       if (!selectedBinId) { setError("Please select a bin to train."); return; }
       setTraining(true); setError(''); setMessage(''); setPredictionResult(null); // Clear other states
       try {
           const response = await trainBinModel(selectedBinId);
           setMessage(response.data?.message || "Training simulation started successfully.");
       } catch (err) {
           console.error("Error triggering training:", err);
           setError(err.response?.data?.message || "Failed to start training simulation.");
       } finally {
           setTraining(false);
       }
  };

  const selectedBin = bins.find(b => b.id === selectedBinId);

  return (
    <div className="page-container prediction-page">
      <h2>Bin Fill Level Prediction (ML Model)</h2>
      <p>Select a bin to train a model (uses simulated data) or make predictions.</p>

      {/* Display Messages/Errors */}
      {error && <p className="prediction-error">{error}</p>}
      {message && <p className="prediction-message">{message}</p>} {/* Added message display */}

      {/* --- Training Section --- */}
      <div className="prediction-section">
        <h3>Train Model</h3>
         <div className="form-group">
           <label htmlFor="binSelectTrain">Select Bin to Train:</label>
           <select
             id="binSelectTrain"
             value={selectedBinId}
             onChange={(e) => { setSelectedBinId(e.target.value); setError(''); setMessage(''); setPredictionResult(null); }} // Clear state on change
             disabled={loadingBins || training || predicting}
           >
             {/* Options loading/population logic (same as prediction form) */}
              {loadingBins ? (<option>Loading...</option>) : bins.length === 0 ? (<option value="" disabled>No bins</option>) :
               (<> <option value="" disabled>-- Select Bin --</option> {bins.map(bin => (<option key={bin.id} value={bin.id}>{bin.name || bin.id}</option>))} </> )
              }
           </select>
         </div>
         <button onClick={handleTrain} disabled={training || predicting || loadingBins || !selectedBinId} className="train-button">
           {training ? 'Training...' : `Train Model for ${selectedBin?.name || 'Selected Bin'}`}
         </button>
      </div>

       {/* --- Prediction Section --- */}
      <div className="prediction-section">
        <h3>Make Prediction</h3>
        <form onSubmit={handlePredict} className="prediction-form">
          {/* Bin Selection (can potentially reuse selectedBinId) */}
          <div className="form-group">
            <label htmlFor="binSelectPredict">Bin (Model must be trained):</label>
            {/* Display selected bin name - disabled dropdown for clarity */}
            <input type="text" value={selectedBin?.name || (selectedBinId ? selectedBinId : 'No Bin Selected')} disabled style={{ fontStyle: selectedBinId ? 'normal':'italic' }}/>
          </div>

          {/* Hours Ahead Input */}
          <div className="form-group">
            <label htmlFor="hoursPredict">Hours Ahead (1-48):</label>
            <input type="number" id="hoursPredict" value={predictionHours} onChange={(e) => setPredictionHours(parseInt(e.target.value, 10))} min="1" max="48" required disabled={predicting || training || !selectedBinId} />
          </div>

          <button type="submit" disabled={predicting || training || loadingBins || !selectedBinId}>
            {predicting ? 'Predicting...' : 'Predict Fill Level'}
          </button>
        </form>

        {/* Display Prediction Result */}
        {predictionResult && (
          <div className="prediction-result">
            <h3>Prediction Result</h3>
            <p> The predicted fill level in <strong>{predictionResult.hoursAhead} hours</strong> is approx. <strong>{predictionResult.predictedFillLevel?.toFixed(1)}%</strong>.</p>
            <p className="disclaimer">(Based on a simple Linear Regression model trained on simulated data)</p>
          </div>
        )}
      </div>

    </div>
  );
}

// Full function definition for fetchBins
// const fetchBins = async () => { try { setLoadingBins(true); setError(''); const response = await getAllBins(); const validBins = response.data.filter(b => b.location); setBins(validBins); if (validBins.length > 0 && !selectedBinId) { setSelectedBinId(validBins[0].id); } } catch (err) { console.error("Error fetching bins:", err); setError("Could not load bins list."); } finally { setLoadingBins(false); } };


export default PredictionPage;