import React from 'react';
import ReactPaginate from 'react-paginate';
import './PaginationComponent.css'; // Import CSS for styling

// Reusable pagination component using react-paginate
function PaginationComponent({ pageCount, onPageChange, forcePage }) {

  // Don't render pagination controls if there's only one page or less
  if (pageCount <= 1) {
    return null;
  }

  // Render the react-paginate component with configuration
  return (
    <ReactPaginate
      previousLabel={'< Prev'} // Text/icon for the previous page button
      nextLabel={'Next >'}   // Text/icon for the next page button
      breakLabel={'...'}       // Text/icon for ellipsis break ('...')
      pageCount={pageCount}    // Total number of pages (calculated in parent)
      marginPagesDisplayed={2} // Number of pages to display at the beginning and end (e.g., 1, 2, ..., 9, 10)
      pageRangeDisplayed={3}   // Number of pages to display in the central range (e.g., ..., 4, 5, 6, ...)
      onPageChange={onPageChange} // Callback function when a page number is clicked ({ selected: pageIndex })
      containerClassName={'pagination-container'} // CSS class for the main <ul> element
      pageClassName={'page-item'}             // CSS class for each page number <li>
      pageLinkClassName={'page-link'}         // CSS class for the page number <a> tag
      previousClassName={'page-item'}         // CSS class for the "Previous" <li>
      previousLinkClassName={'page-link'}     // CSS class for the "Previous" <a> tag
      nextClassName={'page-item'}             // CSS class for the "Next" <li>
      nextLinkClassName={'page-link'}         // CSS class for the "Next" <a> tag
      breakClassName={'page-item'}            // CSS class for the ellipsis <li>
      breakLinkClassName={'page-link'}        // CSS class for the ellipsis <a> tag
      activeClassName={'active'}              // CSS class added to the currently active page <li>
      // forcePage prop can be used to programmatically set the current page from the parent.
      // Useful for resetting to page 0 after filtering/searching.
      // Pass the state variable holding the current page index (e.g., currentPage).
      // Note: react-paginate resets based on the *value* changing.
      // If simply resetting to 0 doesn't trigger visually, you might need a key prop on
      // ReactPaginate that changes when you reset, forcing a re-mount.
      forcePage={forcePage} // Pass the current page index (0-based)
    />
  );
}

export default PaginationComponent;