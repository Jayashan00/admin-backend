import React, { useState, useMemo } from 'react'; // Import useMemo
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: '100%',
  height: '600px', // Maintain consistent height
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 6.9271, // Colombo
  lng: 79.8612
};

// --- Icon Definitions ---

// Base symbol for the truck (arrow) moved inside component

// Function to get bin icon (color by fill level, slightly different if on route) moved inside component


// --- Component ---

function WasteMap({ bins, trucks, activeRoute }) {
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['maps'], // Explicitly load maps library might help
  });

  // --- Data Filtering and Processing ---
  // Memoize filters to avoid recalculating on every render
  const validBins = useMemo(() =>
    bins.filter(b => b.location?.latitude != null && b.location?.longitude != null),
    [bins]
  );
  const validTrucks = useMemo(() =>
    trucks.filter(t => t.currentLocation?.latitude != null && t.currentLocation?.longitude != null),
    [trucks]
  );

  const { polylinePath, routeCoordSet } = useMemo(() => {
    const path = Array.isArray(activeRoute)
      ? activeRoute.map(coord => ({ lat: coord[0], lng: coord[1] }))
      : [];
    // Create a Set of "lat,lng" strings for easy checking if a bin is on the route
    const coordSet = new Set(
        Array.isArray(activeRoute) ? activeRoute.map(coord => `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`) : []
    );
    return { polylinePath: path, routeCoordSet: coordSet };
  }, [activeRoute]); // Recalculate only when activeRoute changes


  // --- Render Logic ---

  if (loadError) return <div className="map-error">Error loading maps</div>;
  if (!isLoaded) return <div className="map-loading">Loading Map...</div>; // Show loading until API is ready

  // +++ Define Icons *after* isLoaded check +++
  const truckBaseSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillOpacity: 1,
      strokeWeight: 1,
      anchor: new google.maps.Point(0, 2.5), // google object is now available
  };

  const getTruckIcon = (status) => {
      let color = '#95a5a6'; // Default Grey
      switch (status) {
          case 'IDLE': color = '#2ecc71'; break; // Green
          case 'EN_ROUTE': color = '#3498db'; break; // Blue
          case 'COLLECTING': color = '#f39c12'; break; // Orange
          case 'RETURNING': color = '#9b59b6'; break; // Purple
          default: break;
      }
      return { ...truckBaseSymbol, fillColor: color };
  };

  const getBinIcon = (fillLevel, isOnRoute = false) => {
      let colorHex = '808080'; // Default Grey
      if (fillLevel > 85) { colorHex = 'e74c3c'; }
      else if (fillLevel > 60) { colorHex = 'f1c40f'; }
      else if (fillLevel >= 0) { colorHex = '2ecc71'; }

      // google object is available here too
      const size = isOnRoute ? new google.maps.Size(30, 30) : new google.maps.Size(25, 25);

      return {
        url: `https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-waypoint-a.png&scale=1.0&color=ff${colorHex}`,
        scaledSize: size,
      };
  };
  // +++ End Icon Definitions +++


  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={13}
      center={defaultCenter}
      options={{ // Optional: Add map options
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
      }}
      onClick={() => { // Click on map closes info windows
        setSelectedBin(null);
        setSelectedTruck(null);
      }}
    >
      {/* Render Bins */}
      {validBins.map(bin => {
        // Check if this bin's location is part of the active route
        const binCoordKey = `${bin.location.latitude.toFixed(5)},${bin.location.longitude.toFixed(5)}`;
        const isOnRoute = routeCoordSet.has(binCoordKey);

        return (
          <Marker
            key={`bin-${bin.id}`}
            position={{
              lat: bin.location.latitude,
              lng: bin.location.longitude
            }}
            // Use function to get icon based on fill level and route status
            icon={getBinIcon(bin.fillLevel, isOnRoute)}
            zIndex={isOnRoute ? 10 : 5} // Bring route bins slightly forward
            onClick={() => { setSelectedBin(bin); setSelectedTruck(null); }}
          />
        );
      })}

      {/* Render Trucks */}
      {validTrucks.map(truck => (
        <Marker
          key={`truck-${truck.id}`}
          position={{
            lat: truck.currentLocation.latitude,
            lng: truck.currentLocation.longitude
          }}
          // Use function to get icon based on truck status
          icon={getTruckIcon(truck.status)}
          zIndex={100} // Keep trucks on top
          onClick={() => { setSelectedTruck(truck); setSelectedBin(null); }}
        />
      ))}

      {/* Render Polyline Route */}
      {polylinePath.length > 0 && (
        <Polyline
          path={polylinePath}
          options={{
            strokeColor: '#0000FF', // Blue line
            strokeOpacity: 0.7,
            strokeWeight: 5, // Slightly thicker line
            zIndex: 50 // Ensure line is below markers but above map tiles
          }}
        />
      )}

      {/* Info Window for selected BIN */}
      {selectedBin && (
        <InfoWindow
          position={{ lat: selectedBin.location.latitude, lng: selectedBin.location.longitude }}
          onCloseClick={() => setSelectedBin(null)}
          options={{ zIndex: 150 }} // Ensure info window is on top
        >
          {/* ++ FIX: Wrap content in a single div ++ */}
          <div>
            <h4>{selectedBin.name || selectedBin.id}</h4>
            <p><b>Status:</b> {selectedBin.status || 'N/A'}</p>
            <p><b>Fill Level:</b> {selectedBin.fillLevel != null ? selectedBin.fillLevel.toFixed(1) + '%' : 'N/A'}</p>
            <p><b>Type:</b> {selectedBin.wasteType || 'N/A'}</p>
          </div>
          {/* ++ END FIX ++ */}
        </InfoWindow>
      )}

      {/* Info Window for selected TRUCK */}
      {selectedTruck && (
        <InfoWindow
          position={{ lat: selectedTruck.currentLocation.latitude, lng: selectedTruck.currentLocation.longitude }}
          onCloseClick={() => setSelectedTruck(null)}
          options={{ zIndex: 150 }} // Ensure info window is on top
        >
           {/* ++ FIX: Wrap content in a single div ++ */}
           <div>
             <h4>Truck: {selectedTruck.licensePlate || selectedTruck.id}</h4>
             <p><b>Status:</b> {selectedTruck.status || 'N/A'}</p>
             <p><b>Fill Level:</b> {selectedTruck.currentFillLevel != null ? selectedTruck.currentFillLevel.toFixed(1) + '%' : 'N/A'}</p>
           </div>
           {/* ++ END FIX ++ */}
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default WasteMap;