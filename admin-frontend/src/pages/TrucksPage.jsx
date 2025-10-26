import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import { getAllTrucks, createTruck, deleteTruck, updateTruck } from '../services/truckService';
import TruckForm from '../components/TruckForm.jsx';
import PaginationComponent from '../components/PaginationComponent.jsx';
import { useSortableData } from '../hooks/useSortableData';

Modal.setAppElement('#root');
const ITEMS_PER_PAGE = 10;

function TrucksPage() {
  const [trucks, setTrucks] = useState([]); // Raw data
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentTruck, setCurrentTruck] = useState(null);
  const [formData, setFormData] = useState({ status: '', currentFillLevel: 0 });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch trucks data
  const fetchTrucks = async () => {
    try { setLoading(true); setError(''); const response = await getAllTrucks(); setTrucks(response.data || []); }
    catch (err) { console.error('Error fetching trucks:', err); setError("Could not load trucks."); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchTrucks(); }, []);

  // Handle creating a new truck
  const handleCreateTruck = async (truckData) => {
    try {
        await createTruck(truckData); // Send POST
        alert('Truck created successfully!');
        await fetchTrucks(); // <<<--- **REFRESH THE LIST** ---<<<
        return Promise.resolve();
    } catch (err) {
        console.error('Error creating truck:', err);
        alert(`Error: ${err.response?.data?.message || "Failed to create truck."}`);
        return Promise.reject(err);
    }
  };

  // Handle deleting a truck
  const handleDeleteTruck = async (id) => {
    if (window.confirm('Are you sure you want to delete this truck?')) {
      try { setLoading(true); await deleteTruck(id); alert('Truck deleted!'); await fetchTrucks(); }
      catch (err) { console.error('Error deleting truck:', err); alert('Failed to delete truck.'); setLoading(false); }
    }
  };

  // --- Modal Control Functions ---
  const openEditModal = (truck) => { setCurrentTruck(truck); setFormData({ status: truck.status || 'IDLE', currentFillLevel: truck.currentFillLevel || 0 }); setModalIsOpen(true); };
  const closeEditModal = () => { setModalIsOpen(false); setCurrentTruck(null); };
  const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleUpdateSubmit = async (e) => { e.preventDefault(); if (!currentTruck) return; try { const dataToUpdate = { ...currentTruck, ...formData, currentFillLevel: parseFloat(formData.currentFillLevel) }; await updateTruck(currentTruck.id, dataToUpdate); alert('Truck updated!'); closeEditModal(); await fetchTrucks(); } catch (error) { console.error('Error updating truck:', error); alert('Failed to update truck.'); } };
  // --- End Modal Functions ---

  // Filter trucks based on searchTerm
  const filteredTrucks = useMemo(() => {
    setCurrentPage(0); // Reset page on search
    if (!searchTerm) return trucks;
    const lower = searchTerm.toLowerCase();
    return trucks.filter(t => (t.licensePlate && t.licensePlate.toLowerCase().includes(lower)) || (t.id && t.id.toLowerCase().includes(lower)) || (t.status && t.status.toLowerCase().includes(lower)) );
  }, [trucks, searchTerm]);

  // Use sorting hook with the *filtered* data
  const { items: sortedAndFilteredTrucks, requestSort, getClassNamesFor } = useSortableData(filteredTrucks, { key: 'licensePlate', direction: 'ascending' });

  // Pagination Logic
  const pageCount = Math.ceil(sortedAndFilteredTrucks.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const currentItems = sortedAndFilteredTrucks.slice(offset, offset + ITEMS_PER_PAGE);
  const handlePageClick = (event) => { setCurrentPage(event.selected); window.scrollTo(0, 0); };


  return (
    <div className="page-container">
      <h2>Truck Management</h2>
      {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

      <TruckForm onTruckCreated={handleCreateTruck} />

       {/* Search Input */}
       <div className="search-container">
           <input type="text" placeholder="Search trucks (license plate, ID, status)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
       </div>

      <h3>All Trucks ({filteredTrucks.length} found)</h3>
       {loading && !error && <p>Loading trucks...</p>}
       {!loading && !error && trucks.length === 0 && <p>No trucks found. Use the form above to add one.</p>}
       {!loading && !error && trucks.length > 0 && filteredTrucks.length === 0 && <p>No trucks match your search term "{searchTerm}".</p>}
       {!loading && !error && filteredTrucks.length > 0 && (
         <> {/* Wrap table and pagination */}
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('licensePlate')} className={getClassNamesFor('licensePlate')}>License Plate</th>
                    <th onClick={() => requestSort('capacity')} className={getClassNamesFor('capacity')}>Capacity (L)</th>
                    <th onClick={() => requestSort('currentFillLevel')} className={getClassNamesFor('currentFillLevel')}>Fill (%)</th>
                    <th onClick={() => requestSort('status')} className={getClassNamesFor('status')}>Status</th>
                    <th onClick={() => requestSort('currentLocation.latitude')} className={getClassNamesFor('currentLocation.latitude')}>Lat</th>
                     <th onClick={() => requestSort('currentLocation.longitude')} className={getClassNamesFor('currentLocation.longitude')}>Lng</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Map over currentItems */}
                  {currentItems.map((truck) => (
                    <tr key={truck.id}>
                      <td>{truck.licensePlate || 'N/A'}</td>
                      <td>{truck.capacity || 'N/A'}</td>
                      <td>{truck.currentFillLevel != null ? truck.currentFillLevel.toFixed(1) + '%' : 'N/A'}</td>
                      <td>{truck.status || 'N/A'}</td>
                      <td>{truck.currentLocation?.latitude?.toFixed(4) || 'N/A'}</td>
                      <td>{truck.currentLocation?.longitude?.toFixed(4) || 'N/A'}</td>
                      <td>
                        <button className="btn-edit" style={{marginRight: '10px'}} onClick={() => openEditModal(truck)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDeleteTruck(truck.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
             {/* Render Pagination Component */}
            <PaginationComponent pageCount={pageCount} onPageChange={handlePageClick} forcePage={currentPage} />
         </>
       )}

      {/* Edit Truck Modal */}
       <Modal isOpen={modalIsOpen} onRequestClose={closeEditModal} contentLabel="Edit Truck">
          <div className="modal-header">
            <h2>Edit Truck: {currentTruck?.licensePlate}</h2>
            <button className="modal-close-btn" onClick={closeEditModal}>&times;</button>
          </div>
          <form className="modal-form" onSubmit={handleUpdateSubmit}>
            <label> Status: <select name="status" value={formData.status} onChange={handleFormChange}> <option value="IDLE">IDLE</option> <option value="EN_ROUTE">EN_ROUTE</option> <option value="COLLECTING">COLLECTING</option> <option value="RETURNING">RETURNING</option> <option value="MAINTENANCE">MAINTENANCE</option> </select> </label>
            <label> Current Fill Level (%): <input type="number" name="currentFillLevel" value={formData.currentFillLevel} onChange={handleFormChange} min="0" max="100" step="0.1" /> </label>
            <button type="submit">Save Changes</button>
          </form>
       </Modal>
    </div>
  );
}

export default TrucksPage;