import React, { useState } from 'react';

function DriverForm({ onDriverCreated }) {
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const driverData = { name, licenseNumber, contactNumber };

    try {
      await onDriverCreated(driverData);
      // Reset form
      setName('');
      setLicenseNumber('');
      setContactNumber('');
      alert('Driver created successfully!');
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Failed to create driver.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bin-form">
      <h3>Add New Driver</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Driver Name"
        required
      />
      <input
        type="text"
        value={licenseNumber}
        onChange={(e) => setLicenseNumber(e.target.value)}
        placeholder="License Number (e.g. B1234567)"
        required
      />
       <input
        type="text"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
        placeholder="Contact Number (e.g. 077...)"
        required
      />
      <button type="submit">Add Driver</button>
    </form>
  );
}

export default DriverForm;