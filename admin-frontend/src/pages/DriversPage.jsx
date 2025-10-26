import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import { getAllDrivers, createDriver, deleteDriver, updateDriver } from '../services/driverService';
import { getAllTrucks } from '../services/truckService';
import DriverForm from '../components/DriverForm.jsx';
import PaginationComponent from '../components/PaginationComponent.jsx';
import { useSortableData } from '../hooks/useSortableData';

Modal.setAppElement('#root');
const ITEMS_PER_PAGE = 10;

function DriversPage() {
  const [drivers, setDrivers] = useState([]); // Raw data
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [formData, setFormData] = useState({ status: '', assignedTruckId: '' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch data
  const fetchData = async () => { try { setLoading(true); setError(''); const [dr, tr] = await Promise.all([ getAllDrivers(), getAllTrucks() ]); setDrivers(dr.data || []); setTrucks(tr.data || []); } catch (err) { console.error('Error fetching data:', err); setError("Could not load data."); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  // Handle creating a new driver
  const handleCreateDriver = async (driverData) => {
    try {
        await createDriver(driverData); // Send POST
        alert('Driver created successfully!');
        await fetchData(); // <<<--- **REFRESH THE LISTS** ---<<<
        return Promise.resolve();
    } catch (err) {
        console.error('Error creating driver:', err);
        alert(`Error: ${err.response?.data?.message || "Failed to create driver."}`);
        return Promise.reject(err);
    }
  };

  // Handle deleting a driver
  const handleDeleteDriver = async (id) => { if (window.confirm('Delete this driver?')) { try { setLoading(true); await deleteDriver(id); alert('Driver deleted!'); await fetchData(); } catch (err) { console.error('Error deleting driver:', err); alert('Failed to delete driver.'); setLoading(false); } } };

  // --- Modal Control Functions ---
  const openEditModal = (driver) => { setCurrentDriver(driver); setFormData({ status: driver.status || 'OFF_DUTY', assignedTruckId: driver.assignedTruckId || '' }); setModalIsOpen(true); };
  const closeEditModal = () => { setModalIsOpen(false); setCurrentDriver(null); };
  const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleUpdateSubmit = async (e) => { e.preventDefault(); if (!currentDriver) return; try { const truckId = formData.assignedTruckId === "" ? null : formData.assignedTruckId; const data = { ...currentDriver, status: formData.status, assignedTruckId: truckId }; await updateDriver(currentDriver.id, data); alert('Driver updated!'); closeEditModal(); await fetchData(); } catch (error) { console.error('Error updating driver:', error); alert('Failed to update driver.'); } };
  // --- End Modal Functions ---

  // Filter drivers based on searchTerm
   const filteredDrivers = useMemo(() => {
     setCurrentPage(0); // Reset page on search
     if (!searchTerm) return drivers;
     const lower = searchTerm.toLowerCase();
     return drivers.filter(d =>
       (d.name && d.name.toLowerCase().includes(lower)) ||
       (d.licenseNumber && d.licenseNumber.toLowerCase().includes(lower)) ||
       (d.contactNumber && d.contactNumber.includes(searchTerm)) ||
       (d.id && d.id.toLowerCase().includes(lower)) ||
       (d.status && d.status.toLowerCase().includes(lower))
     );
   }, [drivers, searchTerm]);

  // Use sorting hook with the *filtered* data
  const { items: sortedAndFilteredDrivers, requestSort, getClassNamesFor } = useSortableData(filteredDrivers, { key: 'name', direction: 'ascending' });

  // Pagination Logic
  const pageCount = Math.ceil(sortedAndFilteredDrivers.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const currentItems = sortedAndFilteredDrivers.slice(offset, offset + ITEMS_PER_PAGE);
  const handlePageClick = (event) => { setCurrentPage(event.selected); window.scrollTo(0, 0); };


  return (
    <div className="page-container">
      <h2>Driver Management</h2>
      {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
      <DriverForm onDriverCreated={handleCreateDriver} />
       <div className="search-container">
           <input type="text" placeholder="Search drivers (name, license, contact, ID, status)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
       </div>

      <h3>All Drivers ({filteredDrivers.length} found)</h3>
       {loading && !error && <p>Loading drivers...</p>}
       {!loading && !error && drivers.length === 0 && <p>No drivers found.</p>}
       {!loading && !error && drivers.length > 0 && filteredDrivers.length === 0 && <p>No drivers match "{searchTerm}".</p>}
       {!loading && !error && filteredDrivers.length > 0 && (
         <> {/* Wrap table and pagination */}
           <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')} className={getClassNamesFor('name')}>Name</th>
                  <th onClick={() => requestSort('licenseNumber')} className={getClassNamesFor('licenseNumber')}>License</th>
                  <th onClick={() => requestSort('contactNumber')} className={getClassNamesFor('contactNumber')}>Contact</th>
                  <th onClick={() => requestSort('status')} className={getClassNamesFor('status')}>Status</th>
                  <th>Assigned Truck</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Map over currentItems */}
                {currentItems.map((driver) => {
                  const assignedTruck = trucks.find(t => t.id === driver.assignedTruckId);
                  return (
                    <tr key={driver.id}>
                      <td>{driver.name || 'N/A'}</td>
                      <td>{driver.licenseNumber || 'N/A'}</td>
                      <td>{driver.contactNumber || 'N/A'}</td>
                      <td>{driver.status || 'N/A'}</td>
                      <td>{assignedTruck ? assignedTruck.licensePlate : 'None'}</td>
                      <td>
                        <button className="btn-edit" style={{marginRight: '10px'}} onClick={() => openEditModal(driver)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDeleteDriver(driver.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
           {/* Render Pagination Component */}
           <PaginationComponent pageCount={pageCount} onPageChange={handlePageClick} forcePage={currentPage} />
         </>
       )}

      {/* Edit Driver Modal */}
       <Modal isOpen={modalIsOpen} onRequestClose={closeEditModal} contentLabel="Edit Driver">
         <div className="modal-header">
           <h2>Edit Driver: {currentDriver?.name}</h2>
           <button className="modal-close-btn" onClick={closeEditModal}>&times;</button>
         </div>
         <form className="modal-form" onSubmit={handleUpdateSubmit}>
           <label> Status: <select name="status" value={formData.status} onChange={handleFormChange}> <option value="OFF_DUTY">OFF_DUTY</option> <option value="ON_DUTY_IDLE">ON_DUTY_IDLE</option> <option value="DRIVING">DRIVING</option> </select> </label>
           <label> Assign Truck: <select name="assignedTruckId" value={formData.assignedTruckId} onChange={handleFormChange}> <option value="">None</option> {trucks.map(truck => ( <option key={truck.id} value={truck.id}> {truck.licensePlate} (Capacity: {truck.capacity || 'N/A'}L) </option> ))} {trucks.length === 0 && <option value="" disabled>No trucks available</option>} </select> </label>
           <button type="submit">Save Changes</button>
         </form>
       </Modal>
    </div>
  );
}

export default DriversPage;