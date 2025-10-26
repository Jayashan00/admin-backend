import { useMemo } from 'react';

// Custom Hook to calculate dashboard statistics
export function useDashboardStats(bins = [], trucks = []) { // Default to empty arrays

  const stats = useMemo(() => {
    // Bin Stats
    const totalBins = bins.length;
    const fullBins = bins.filter(bin => bin.fillLevel != null && bin.fillLevel > 85).length;

    // Calculate average fill level, ignoring bins with null fillLevel
    const binsWithLevels = bins.filter(bin => bin.fillLevel != null);
    const averageFillLevel = binsWithLevels.length > 0
      ? binsWithLevels.reduce((sum, bin) => sum + bin.fillLevel, 0) / binsWithLevels.length
      : 0; // Avoid division by zero

    // Truck Stats
    const totalTrucks = trucks.length;
    const activeTrucks = trucks.filter(truck =>
        truck.status === 'EN_ROUTE' || truck.status === 'RETURNING' || truck.status === 'COLLECTING'
    ).length;
    const idleTrucks = trucks.filter(truck => truck.status === 'IDLE').length;

    return {
      totalBins,
      fullBins,
      averageFillLevel: parseFloat(averageFillLevel.toFixed(1)), // Format to one decimal place
      totalTrucks,
      activeTrucks,
      idleTrucks,
    };
  }, [bins, trucks]); // Recalculate only when bins or trucks arrays change

  return stats; // Return the calculated stats object
}