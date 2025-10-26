import React, { useState, useEffect, useMemo, useRef } from 'react';
import WasteMap from '../components/WasteMap.jsx';
import BinStatusChart from '../components/BinStatusChart.jsx';
import TruckStatusChart from '../components/TruckStatusChart.jsx';
import KpiWidget from '../components/KpiWidget.jsx';
import FillLevelHistoryChart from '../components/FillLevelHistoryChart.jsx';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { getAllBins } from '../services/binService';
import { getAllTrucks } from '../services/truckService';
import { runSimulationTick } from '../services/simulationService';
import { generateRoute } from '../services/routingService';
import './DashboardPage.css'; // Import dashboard grid CSS

function DashboardPage() {
  const [bins, setBins] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [activeRoute, setActiveRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeGenerating, setRouteGenerating] = useState(false);
  // State for Simulation Control
  const [isPaused, setIsPaused] = useState(false); // Initially running
  // useRef to hold the interval ID so it persists across renders
  const intervalRef = useRef(null);

  // Use the custom hook to get stats
  const stats = useDashboardStats(bins, trucks);

  // Function to fetch data and optionally run simulation tick
  // Modified to respect isPaused state
  const fetchData = async (runSimulation = true) => {
    try {
      // Only run simulation tick if runSimulation is true AND simulation is not paused
      if (runSimulation && !isPaused) {
        // console.log("Running simulation tick..."); // Debug log
        await runSimulationTick();
      } else {
        // console.log(`Skipping simulation tick (runSimulation=${runSimulation}, isPaused=${isPaused})`); // Debug log
      }

      // Fetch fresh data AFTER simulation tick (or if tick was skipped)
      const binsRes = await getAllBins();
      const trucksRes = await getAllTrucks();
      const fetchedBins = binsRes.data || [];
      const fetchedTrucks = trucksRes.data || [];

      setBins(fetchedBins);
      setTrucks(fetchedTrucks);

      // Find and set the active route
      const truckWithRoute = fetchedTrucks.find(t => t.currentRoute && Array.isArray(t.currentRoute) && t.currentRoute.length > 0);
      const newActiveRoute = truckWithRoute ? truckWithRoute.currentRoute : [];
      // Only update state if the route actually changed to prevent map flicker
      if (JSON.stringify(activeRoute) !== JSON.stringify(newActiveRoute)) {
           setActiveRoute(newActiveRoute);
      }

    } catch (error) {
      console.error('Error fetching data for map:', error);
      setActiveRoute([]); // Clear route on error
    } finally {
        // Ensure loading is false after initial fetch or actions
        if(loading) setLoading(false);
    }
  };

  // Function to manually trigger a single simulation tick and data refresh
  const handleManualTick = async () => {
      console.log("Manual simulation tick triggered.");
      setLoading(true); // Show loading indicator during manual tick
      // Force run simulation tick *even if paused* then fetch data
      try {
          await runSimulationTick(); // Explicitly run the tick
          await fetchData(false); // Fetch data *without* running tick again
      } catch (error) {
          console.error("Error during manual tick:", error);
      } finally {
         setLoading(false);
      }
  };

  // Function to toggle pause/resume state
  const togglePause = () => {
      setIsPaused(prevPaused => !prevPaused);
  };

  // useEffect for interval - Modified to handle pause/resume
  useEffect(() => {
    // Clear any existing interval when isPaused changes
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("Cleared existing interval.");
    }

    // Only set up the interval if the simulation is NOT paused
    if (!isPaused) {
        console.log("Setting up 5-second interval...");
        // Fetch data immediately when resuming or on initial load (if not paused)
        // Fetch without simulation first to show current state quickly before first tick
        fetchData(false);

        // Then set the interval to fetch *with* simulation tick enabled internally
        intervalRef.current = setInterval(() => {
            fetchData(true); // fetchData will check isPaused again, but interval runs only when not paused initially
        }, 5000); // 5-second refresh

    } else {
         console.log("Simulation Paused. Interval cleared.");
         // Fetch data one last time without simulation when pausing to show final state
         fetchData(false);
    }

    // Cleanup function: Clear the interval when the component unmounts
    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            console.log("Cleared interval on unmount.");
        }
    };
    // Dependency: Re-run effect ONLY if isPaused changes
  }, [isPaused]); // eslint-disable-line react-hooks/exhaustive-deps
  // Do not add fetchData to dependencies, it causes issues with intervals


  // handleGenerateRoute (no changes needed from previous step)
  const handleGenerateRoute = async () => {
    const idleTruck = trucks.find(t => t.status === 'IDLE');
    if (!idleTruck || !idleTruck.id) {
      alert('No idle trucks available or truck has no ID.');
      return;
    }
    setRouteGenerating(true);
    try {
      const response = await generateRoute(idleTruck.id);
      if (response && response.data && Array.isArray(response.data)) {
        setActiveRoute(response.data);
      } else { throw new Error("Invalid route data received from server."); }
      await fetchData(false); // Refresh immediately without sim tick
    } catch (error) {
      console.error("Error generating route:", error);
      alert(error.message || "Failed to generate route. Are there any bins > 85%?");
      setActiveRoute([]);
    } finally {
      setRouteGenerating(false);
    }
  };


  // --- JSX structure ---
  return (
    <div className="dashboard-page-wrapper">
        {/* KPI Widgets */}
        <div className="kpi-widget-container">
            <KpiWidget title="Total Bins" value={stats.totalBins} icon="🗑️" />
            <KpiWidget title="Full Bins (>85%)" value={stats.fullBins} icon="⚠️" />
            <KpiWidget title="Avg. Bin Fill" value={stats.averageFillLevel} unit="%" icon="📊" />
            <KpiWidget title="Idle Trucks" value={`${stats.idleTrucks} / ${stats.totalTrucks}`} icon="🅿️" />
            <KpiWidget title="Active Trucks" value={`${stats.activeTrucks} / ${stats.totalTrucks}`} icon="🚚" />
        </div>

        {/* Main Dashboard Grid (Map + Sidebar) */}
        <div className="dashboard-grid-container">
          {/* Map Area */}
          <div className="page-container map-container">
             {/* Map Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}> {/* Allow wrapping */}
              {/* Left Side: Title & Info */}
              <div>
                <h3 style={{marginTop: 0, marginBottom: '0.2rem'}}>Live Waste Map</h3>
                 <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted-color)' }}>
                     {isPaused ? 'Simulation Paused' : 'Refreshes every 5 seconds'}
                 </p>
              </div>
              {/* Right Side: Buttons */}
              <div className="map-controls"> {/* Container for buttons */}
                  <button onClick={togglePause} className={`sim-control-btn ${isPaused ? 'sim-resume' : 'sim-pause'}`}>
                      {isPaused ? '▶ Resume Sim' : '❚❚ Pause Sim'}
                  </button>
                  {/* Show manual tick only when paused */}
                  {isPaused && (
                      <button onClick={handleManualTick} disabled={loading} className="sim-control-btn sim-tick">
                          {loading ? 'Processing...' : 'Manual Tick →'}
                      </button>
                  )}
                  <button onClick={handleGenerateRoute} disabled={routeGenerating || loading} className="generate-route-btn">
                    {routeGenerating ? 'Generating...' : 'Generate Route'} {/* Shortened text */}
                  </button>
              </div>
            </div>
            {/* Map Component */}
            {/* Show specific loading state for map if main loading is true */}
            {loading ? ( <div className="map-loading">Loading map data...</div> )
             : ( <WasteMap bins={bins} trucks={trucks} activeRoute={activeRoute} /> )
            }
          </div>

          {/* Sidebar */}
          <div className="page-container stats-sidebar">
            <h3>Analytics</h3>
            {/* Show loading state for charts if main loading is true */}
            {loading ? ( <div>Loading charts...</div> )
             : (
               <>
                 <BinStatusChart bins={bins} />
                 <hr style={{margin: '20px 0', borderColor: 'var(--border-color)'}} />
                 <TruckStatusChart trucks={trucks} />
                 <hr style={{margin: '20px 0', borderColor: 'var(--border-color)'}} />
                 <FillLevelHistoryChart bins={bins} />
               </>
             )
            }
          </div>
        </div>
    </div>
  );
}

export default DashboardPage;