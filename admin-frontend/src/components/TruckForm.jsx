import React, { useState } from 'react';

function TruckForm({ onTruckCreated }) {
  const [licensePlate, setLicensePlate] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const truckData = {
      licensePlate: licensePlate,
      capacity: parseFloat(capacity),
      // Default values are set by the backend (status, fill, location)
    };

    try {
      await onTruckCreated(truckData);
      // Reset form
      setLicensePlate('');
      setCapacity('');
      alert('Truck created successfully!');
    } catch (error) {
      console.error('Error creating truck:', error);
      alert('Failed to create truck.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bin-form"> {/* We can reuse the bin-form style */}
      <h3>Add New Truck</h3>
      <input
        type="text"
        value={licensePlate}
        onChange={(e) => setLicensePlate(e.target.value)}
        placeholder="License Plate (e.g. WP BCD-1234)"
        required
      />
      <input
        type="number"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder="Capacity (Liters)"
        required
      />
      <button type="submit">Add Truck</button>
    </form>
  );
}

export default TruckForm;