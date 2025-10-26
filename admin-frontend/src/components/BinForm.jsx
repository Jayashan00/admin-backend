import React, { useState } from 'react';

// 'onBinCreated' is a function passed down from the parent page
// to refresh the bin list after we create a new one.
function BinForm({ onBinCreated }) {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capacity, setCapacity] = useState('');
  const [wasteType, setWasteType] = useState('MIXED'); // Default value

  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the form from refreshing the page

    // This is the JSON object we will send to the backend
    // It must match your Spring Boot 'Bin' model
    const binData = {
      name: name,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      capacity: parseFloat(capacity),
      wasteType: wasteType,
      status: 'EMPTY', // Set a default status
      // fillLevel is set by the backend, so we don't send it
    };

    try {
      // We pass this data to the 'createBin' function we made
      await onBinCreated(binData);

      // Reset the form fields
      setName('');
      setLatitude('');
      setLongitude('');
      setCapacity('');
      setWasteType('MIXED');
      alert('Bin created successfully!');
    } catch (error) {
      console.error('Error creating bin:', error);
      alert('Failed to create bin.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bin-form">
      <h3>Add New Bin</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Bin Name (e.g. Colombo-07 Bin)"
        required
      />
      <input
        type="number"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        placeholder="Latitude (e.g. 6.9271)"
        required
      />
      <input
        type="number"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
        placeholder="Longitude (e.g. 79.8612)"
        required
      />
      <input
        type="number"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder="Capacity (Liters)"
        required
      />
      <select value={wasteType} onChange={(e) => setWasteType(e.target.value)}>
        <option value="MIXED">Mixed</option>
        <option value="ORGANIC">Organic (Decaying)</option>
        <option value="NON_ORGANIC">Non-Organic</option>
      </select>
      <button type="submit">Add Bin</button>
    </form>
  );
}

export default BinForm;