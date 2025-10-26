import { useState, useMemo } from 'react';

// Custom hook for sorting table data client-side
export const useSortableData = (items = [], initialConfig = { key: null, direction: 'ascending' }) => {
  const [sortConfig, setSortConfig] = useState(initialConfig);

  // Memoize the sorted items array. It only re-calculates if 'items' or 'sortConfig' changes.
  const sortedItems = useMemo(() => {
    let sortableItems = [...items]; // Create a mutable copy to avoid sorting the original prop array

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        // Helper function to safely access nested properties (e.g., 'location.latitude')
        const getNestedValue = (obj, key) => {
            if (!key) return undefined; // Handle null/undefined key
            // Use optional chaining (?.) for safer access
            return key.split('.').reduce((o, k) => o?.[k], obj);
        };


        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        // Handle null or undefined values - sort them consistently (e.g., to the end)
        const nullsLast = sortConfig.direction === 'ascending' ? 1 : -1;
        if (aValue === undefined || aValue === null) return nullsLast;
        if (bValue === undefined || bValue === null) return -nullsLast;

        // Attempt numeric comparison first
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);

        if (!isNaN(numA) && !isNaN(numB)) {
            if (numA < numB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (numA > numB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }

        // Fallback to locale-aware string comparison
        const strA = String(aValue).toLowerCase();
        const strB = String(bValue).toLowerCase();

        if (strA < strB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (strA > strB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0; // Values are equal
      });
    }
    return sortableItems;
  }, [items, sortConfig]); // Dependencies for useMemo

  // Function called when a table header is clicked to request sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    // If clicking the same column header again, toggle the sort direction
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    // Set the new sort configuration (key to sort by, and direction)
    setSortConfig({ key, direction });
  };

  // Function to get the CSS class ('ascending' or 'descending') for a table header
  // Used to display the sort direction arrow
  const getClassNamesFor = (name) => {
    if (!sortConfig || sortConfig.key !== name) {
      return undefined; // No class if not sorted by this key
    }
    return sortConfig.direction; // 'ascending' or 'descending'
  };


  // Return the sorted data, the sort request function, and the class name helper
  return { items: sortedItems, requestSort, getClassNamesFor, sortConfig };
};