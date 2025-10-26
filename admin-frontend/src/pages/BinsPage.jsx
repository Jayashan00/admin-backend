import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import { getAllBins, createBin, deleteBin, updateBin } from '../services/binService';
import BinForm from '../components/BinForm.jsx';
import PaginationComponent from '../components/PaginationComponent.jsx';
import { useSortableData } from '../hooks/useSortableData';

Modal.setAppElement('#root');
const ITEMS_PER_PAGE = 10;

function BinsPage() {
  const [bins, setBins] = useState([]); // Raw data from API
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentBin, setCurrentBin] = useState(null);
  const [formData, setFormData] = useState({ status: '', fillLevel: 0, wasteType: 'MIXED' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch bins data
  const fetchBins = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllBins();
      setBins(response.data || []); // Ensure bins is an array
    } catch (err) {
      console.error('Error fetching bins:', err);
      setError("Could not load bins.");
    } finally {
      setLoading(false);
    }
  };
  // Fetch data when component mounts
  useEffect(() => {
    fetchBins();
  }, []);

  // Handle creating a new bin
  const handleCreateBin = async (binData) => {
    try {
        await createBin(binData); // Send POST request
        alert('Bin created successfully!');
        await fetchBins(); // <<<--- **REFRESH THE LIST** ---<<<
        return Promise.resolve(); // Indicate success
    } catch (err) {
        console.error("Error creating bin:", err);
        alert(`Error: ${err.response?.data?.message || "Failed to create bin."}`);
        return Promise.reject(err); // Indicate failure
    }
  };

  // Handle deleting a bin
  const handleDeleteBin = async (id) => {
    if (window.confirm('Are you sure you want to delete this bin?')) {
      try {
        setLoading(true); // Indicate loading during delete
        await deleteBin(id);
        alert('Bin deleted successfully!');
        await fetchBins(); // Refresh list after delete
      } catch (err) {
        console.error('Error deleting bin:', err);
        alert('Failed to delete bin.');
        setLoading(false); // Turn off loading on error
      }
      // setLoading(false) is handled by fetchBins on success
    }
  };

  // --- Modal Control Functions ---
  const openEditModal = (bin) => {
    setCurrentBin(bin);
    setFormData({
      status: bin.status || 'EMPTY',
      fillLevel: bin.fillLevel || 0,
      wasteType: bin.wasteType || 'MIXED',
    });
    setModalIsOpen(true);
  };
  const closeEditModal = () => {
    setModalIsOpen(false);
    setCurrentBin(null);
  };
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!currentBin) return;
    try {
      const dataToUpdate = { ...currentBin, ...formData, fillLevel: parseFloat(formData.fillLevel) };
      await updateBin(currentBin.id, dataToUpdate);
      alert('Bin updated successfully!');
      closeEditModal();
      await fetchBins(); // Refresh list after update
    } catch (err) {
      console.error('Error updating bin:', err);
      alert('Failed to update bin.');
      // Keep modal open on error? closeEditModal();
    }
  };
  // --- End Modal Functions ---

  // Filter bins based on searchTerm
  const filteredBins = useMemo(() => {
    setCurrentPage(0); // Reset page to 0 whenever search term changes
    if (!searchTerm) return bins;
    const lower = searchTerm.toLowerCase();
    return bins.filter(b =>
        (b.name && b.name.toLowerCase().includes(lower)) ||
        (b.id && b.id.toLowerCase().includes(lower)) ||
        (b.status && b.status.toLowerCase().includes(lower)) ||
        (b.wasteType && b.wasteType.toLowerCase().includes(lower))
    );
  }, [bins, searchTerm]); // Dependency array includes searchTerm

  // Use sorting hook with the *filtered* data
  const { items: sortedAndFilteredBins, requestSort, getClassNamesFor } = useSortableData(filteredBins, { key: 'name', direction: 'ascending' });

  // Pagination Logic
  const pageCount = Math.ceil(sortedAndFilteredBins.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const currentItems = sortedAndFilteredBins.slice(offset, offset + ITEMS_PER_PAGE);
  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
    window.scrollTo(0, 0); // Scroll to top
  };


  return (
    <div className="page-container">
      <h2>Bin Management</h2>
      {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

      <BinForm onBinCreated={handleCreateBin} />

      {/* Search Input */}
      <div className="search-container">
          <input type="text" placeholder="Search bins (name, ID, status, type)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
      </div>

      <h3>All Bins ({filteredBins.length} found)</h3>
      {loading && !error && <p>Loading bins...</p>}
      {!loading && !error && bins.length === 0 && <p>No bins found. Use the form above to add one.</p>}
      {!loading && !error && bins.length > 0 && filteredBins.length === 0 && <p>No bins match your search term "{searchTerm}".</p>}
      {!loading && !error && filteredBins.length > 0 && (
        <> {/* Wrap table and pagination */}
          <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('name')} className={getClassNamesFor('name')}>Name</th>
                    <th onClick={() => requestSort('location.latitude')} className={getClassNamesFor('location.latitude')}>Lat</th>
                    <th onClick={() => requestSort('location.longitude')} className={getClassNamesFor('location.longitude')}>Lng</th>
                    <th onClick={() => requestSort('wasteType')} className={getClassNamesFor('wasteType')}>Waste Type</th>
                    <th onClick={() => requestSort('capacity')} className={getClassNamesFor('capacity')}>Capacity (L)</th>
                    <th onClick={() => requestSort('fillLevel')} className={getClassNamesFor('fillLevel')}>Fill (%)</th>
                    <th onClick={() => requestSort('status')} className={getClassNamesFor('status')}>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Map over currentItems (paginated data) */}
                  {currentItems.map((bin) => (
                    <tr key={bin.id}>
                      <td>{bin.name || 'N/A'}</td>
                      <td>{bin.location?.latitude?.toFixed(4) || 'N/A'}</td>
                      <td>{bin.location?.longitude?.toFixed(4) || 'N/A'}</td>
                      <td>{bin.wasteType || 'N/A'}</td>
                      <td>{bin.capacity || 'N/A'}</td>
                      <td>{bin.fillLevel != null ? bin.fillLevel.toFixed(1) + '%' : 'N/A'}</td>
                      <td>{bin.status || 'N/A'}</td>
                      <td>
                         <button className="btn-edit" style={{marginRight: '10px'}} onClick={() => openEditModal(bin)}>Edit</button>
                         <button className="btn-delete" onClick={() => handleDeleteBin(bin.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          {/* Render Pagination Component */}
          <PaginationComponent
              pageCount={pageCount}
              onPageChange={handlePageClick}
              forcePage={currentPage} // Pass currentPage to reset view when filtering
          />
        </>
      )}

      {/* Edit Bin Modal */}
       <Modal isOpen={modalIsOpen} onRequestClose={closeEditModal} contentLabel="Edit Bin">
         <div className="modal-header">
           <h2>Edit Bin: {currentBin?.name || currentBin?.id}</h2>
           <button className="modal-close-btn" onClick={closeEditModal}>&times;</button>
         </div>
         <form className="modal-form" onSubmit={handleUpdateSubmit}>
           <label> Fill Level (%): <input type="number" name="fillLevel" value={formData.fillLevel} onChange={handleFormChange} min="0" max="100" step="0.1" /></label>
           <label> Status: <select name="status" value={formData.status} onChange={handleFormChange}> <option value="EMPTY">EMPTY</option> <option value="FILLING">FILLING</option> <option value="FULL">FULL</option> <option value="OVERFLOWING">OVERFLOWING</option> <option value="MAINTENANCE">MAINTENANCE</option> </select> </label>
           <label> Waste Type: <select name="wasteType" value={formData.wasteType} onChange={handleFormChange}> <option value="MIXED">MIXED</option> <option value="ORGANIC">ORGANIC</option> <option value="NON_ORGANIC">NON_ORGANIC</option> </select> </label>
           <button type="submit">Save Changes</button>
         </form>
       </Modal>
    </div>
  );
}

export default BinsPage;