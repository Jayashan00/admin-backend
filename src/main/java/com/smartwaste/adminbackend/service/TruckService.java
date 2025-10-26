package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.Alert;
import com.smartwaste.adminbackend.model.Bin;
import com.smartwaste.adminbackend.model.Truck;
import com.smartwaste.adminbackend.repository.BinRepository; // Need BinRepository
import com.smartwaste.adminbackend.repository.TruckRepository;
import com.smartwaste.adminbackend.routing.Node; // Need Node for distance calculation
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.util.ArrayList; // Import ArrayList
import java.util.Collections;
import java.util.Comparator; // Import Comparator
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class TruckService {

    @Autowired
    private TruckRepository truckRepository;
    @Autowired // Inject BinRepository
    private BinRepository binRepository;
    @Autowired // Inject AlertService
    private AlertService alertService;
    // AuditLogService removed

    private final Random random = new Random();
    // Simulation constant: How far the truck moves each 'tick' (in km)
    private static final double SIMULATION_STEP_KM = 0.05; // Approx 50 meters

    // Define Depot Location Consistently
    private static final Bin.Location DEPOT_LOCATION = new Bin.Location() {{
        setLatitude(6.9135);
        setLongitude(79.8601);
    }};
    private static final double TRUCK_OVERLOAD_THRESHOLD = 95.0; // Alert threshold
    private static final double TRUCK_FULL_THRESHOLD = 100.0; // Force return threshold


    // =====================================================
    // GET all trucks / GET one truck by ID / DELETE a truck
    // (These methods remain unchanged)
    // =====================================================
    public List<Truck> getAllTrucks() { return truckRepository.findAll(); }
    public Optional<Truck> getTruckById(String id) { return truckRepository.findById(id); }
    public boolean deleteTruck(String id) {
        if (truckRepository.existsById(id)) {
            // Optional: Add logging before delete if needed without AuditService
            truckRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // =====================================================
    // POST (Create) a new truck
    // (Unchanged)
    // =====================================================
    public Truck createTruck(Truck truck) {
        truck.setCurrentFillLevel(0.0);
        truck.setStatus(Truck.TruckStatus.IDLE);
        truck.setCurrentRoute(null);
        if (truck.getCurrentLocation() == null) {
            Bin.Location startLocation = new Bin.Location();
            startLocation.setLatitude(DEPOT_LOCATION.getLatitude() + (random.nextDouble() - 0.5) * 0.01); // Near depot
            startLocation.setLongitude(DEPOT_LOCATION.getLongitude() + (random.nextDouble() - 0.5) * 0.01);
            truck.setCurrentLocation(startLocation);
        }
        return truckRepository.save(truck);
    }

    // =====================================================
    // PUT (Update) an existing truck
    // (Unchanged)
    // =====================================================
    public Optional<Truck> updateTruck(String id, Truck truckDetails) {
        Optional<Truck> optionalTruck = truckRepository.findById(id);
        if (optionalTruck.isPresent()) {
            Truck existingTruck = optionalTruck.get();
            existingTruck.setLicensePlate(truckDetails.getLicensePlate());
            existingTruck.setCapacity(truckDetails.getCapacity());
            existingTruck.setStatus(truckDetails.getStatus());
            existingTruck.setCurrentFillLevel(truckDetails.getCurrentFillLevel());
            existingTruck.setCurrentLocation(truckDetails.getCurrentLocation());
            // Make sure route is also updated if provided, or cleared if status is IDLE/RETURNING without route
            if (truckDetails.getStatus() == Truck.TruckStatus.IDLE) {
                existingTruck.setCurrentRoute(null);
            } else if (truckDetails.getStatus() == Truck.TruckStatus.RETURNING && (truckDetails.getCurrentRoute() == null || truckDetails.getCurrentRoute().isEmpty())) {
                // If manually set to RETURNING without a route, set depot route
                existingTruck.setCurrentRoute(Collections.singletonList(List.of(DEPOT_LOCATION.getLatitude(), DEPOT_LOCATION.getLongitude())));
            }
            else {
                // Otherwise, accept the route provided (or keep existing if not provided)
                if (truckDetails.getCurrentRoute() != null) {
                    existingTruck.setCurrentRoute(truckDetails.getCurrentRoute());
                }
            }
            return Optional.of(truckRepository.save(existingTruck));
        }
        return Optional.empty();
    }


    // =====================================================
    // SMART SIMULATION METHOD V3.2 (Includes Bin Emptying)
    // =====================================================
    @Transactional // Ensures all DB updates succeed or fail together
    public void simulateTruckMovement() {
        // Find trucks actively working on a route (EN_ROUTE or RETURNING with a non-empty route)
        List<Truck> activeTrucks = truckRepository.findAll().stream()
                .filter(truck -> (truck.getStatus() == Truck.TruckStatus.EN_ROUTE || truck.getStatus() == Truck.TruckStatus.RETURNING) &&
                        truck.getCurrentRoute() != null && !truck.getCurrentRoute().isEmpty())
                .toList();

        // Handle randomly moving EN_ROUTE trucks separately (those without a route yet)
        simulateRandomMovementForUnroutedTrucks();

        if (activeTrucks.isEmpty()) {
            return; // No trucks following a route
        }

        List<Truck> trucksToSave = new ArrayList<>(); // Collect trucks needing saving within the transaction
        List<Bin> binsToSave = new ArrayList<>(); // ++ List to collect updated bins ++


        for (Truck truck : activeTrucks) {
            Bin.Location currentLocation = truck.getCurrentLocation();
            // Important: Get a mutable copy of the route if it exists, otherwise empty list
            List<List<Double>> route = truck.getCurrentRoute() != null ? new ArrayList<>(truck.getCurrentRoute()) : new ArrayList<>();
            Bin.Location targetLocation;

            // Ensure route isn't empty after filtering
            if (route.isEmpty()) {
                System.err.println("Truck " + truck.getId() + " (" + truck.getStatus() + ") is active but has empty route. Setting to IDLE.");
                handleRouteCompletion(truck, isLocationEqual(currentLocation, DEPOT_LOCATION)); // Use helper
                trucksToSave.add(truck);
                continue; // Skip rest of loop for this truck
            }

            // Determine Target
            if (truck.getStatus() == Truck.TruckStatus.RETURNING) {
                // Ensure route is *only* the depot if returning
                if (route.size() > 1 || !isLocationEqual(createLocationFromCoords(route.get(0)), DEPOT_LOCATION)) {
                    System.out.println("Correcting route for RETURNING truck " + truck.getId());
                    route = new ArrayList<>(Collections.singletonList(List.of(DEPOT_LOCATION.getLatitude(), DEPOT_LOCATION.getLongitude())));
                }
                targetLocation = createLocationFromCoords(route.get(0)); // Get target from corrected route

            } else { // EN_ROUTE
                targetLocation = createLocationFromCoords(route.get(0));
            }

            // Safety check for current location
            if (currentLocation == null) {
                currentLocation = initializeLocationNear(targetLocation);
                truck.setCurrentLocation(currentLocation);
            }
            // Safety check for target location
            if(targetLocation == null){
                System.err.println("Target location is null for truck " + truck.getId() + ". Setting to IDLE.");
                handleRouteCompletion(truck, isLocationEqual(currentLocation, DEPOT_LOCATION));
                trucksToSave.add(truck);
                continue;
            }


            double distanceToTarget = Node.calculateDistance(currentLocation, targetLocation);

            // Check if reached target
            if (distanceToTarget < SIMULATION_STEP_KM) {
                // --- Waypoint Reached Logic ---
                // Pass the mutable 'route' list AND the 'binsToSave' list
                handleWaypointReached(truck, targetLocation, route, binsToSave); // Modifies truck status/route/fill & potentially adds to binsToSave
                trucksToSave.add(truck); // Mark truck for saving

            } else {
                // --- Move Towards Target Logic ---
                moveTruckTowards(truck, targetLocation); // Modifies truck location
                trucksToSave.add(truck); // Mark truck for saving
            }
        } // End loop through active trucks

        // Save all changes transactionally
        if (!trucksToSave.isEmpty()) {
            truckRepository.saveAll(trucksToSave);
            System.out.println("Saved " + trucksToSave.size() + " truck updates.");
        }
        // ++ Save updated bins ++
        if (!binsToSave.isEmpty()) {
            binRepository.saveAll(binsToSave);
            System.out.println("Saved " + binsToSave.size() + " bin updates (emptied).");
        }
    }


    // HELPER: Logic when a truck reaches a waypoint (Modifies truck, route list, AND ADDS TO BINS TO SAVE LIST)
    private void handleWaypointReached(Truck truck, Bin.Location targetLocation, List<List<Double>> route, List<Bin> binsToSave) { // ++ Added binsToSave ++
        System.out.println("Truck " + truck.getId() + " reached waypoint: " + targetLocation.getLatitude() + "," + targetLocation.getLongitude());
        truck.setCurrentLocation(targetLocation); // Snap to target

        boolean isDepotWaypoint = isLocationEqual(targetLocation, DEPOT_LOCATION);

        // ++ Variable to store ID of the bin at this location ++
        String reachedBinId = null;
        if (!isDepotWaypoint) {
            // Try to find the bin at this location to get its ID
            Optional<Bin> reachedBinOpt = findBinByLocation(targetLocation);
            if(reachedBinOpt.isPresent()){
                reachedBinId = reachedBinOpt.get().getId();
            } else {
                System.err.println("Warning: Truck " + truck.getId() + " reached a non-depot waypoint but could not find corresponding Bin in DB.");
            }
        }

        // Remove reached waypoint from the route list (passed by reference)
        if (!route.isEmpty()) {
            route.remove(0);
        } else {
            System.err.println("Error: Reached waypoint but route list was already empty for truck " + truck.getId());
        }

        // --- Handle Collection, Bin Emptying & Overload ---
        if (!isDepotWaypoint && truck.getStatus() == Truck.TruckStatus.EN_ROUTE) {
            double fillIncrease = 15.0 + (random.nextDouble() * 10.0);
            double oldFillLevel = truck.getCurrentFillLevel() != null ? truck.getCurrentFillLevel() : 0.0;
            double newFillLevel = Math.min(100.0, oldFillLevel + fillIncrease);
            truck.setCurrentFillLevel(newFillLevel);
            System.out.println("Truck " + truck.getLicensePlate() + " collected waste. Fill: " + String.format("%.1f", newFillLevel) + "%");

            // ++ Empty the Bin ++
            if(reachedBinId != null) {
                Optional<Bin> collectedBinOpt = binRepository.findById(reachedBinId); // Fetch again by ID for safety within transaction
                collectedBinOpt.ifPresent(bin -> {
                    System.out.println("Emptying Bin: " + bin.getId() + " (Old level: " + bin.getFillLevel() + ")");
                    bin.setFillLevel(0.0); // Reset fill level
                    bin.setStatus(Bin.BinStatus.EMPTY); // Update status
                    binsToSave.add(bin); // Add to list for saving later
                });
            }
            // ++ End Bin Emptying ++


            // --- OVERLOAD CHECK & ALERT ---
            boolean justBecameOverloaded = newFillLevel >= TRUCK_OVERLOAD_THRESHOLD && oldFillLevel < TRUCK_OVERLOAD_THRESHOLD;
            boolean isNowFull = newFillLevel >= TRUCK_FULL_THRESHOLD;

            if (isNowFull) { // Check for 100% first
                System.out.println("Truck " + truck.getLicensePlate() + " is full (>=100%)! Returning to depot.");
                truck.setStatus(Truck.TruckStatus.RETURNING);
                List<List<Double>> remainingRoute = new ArrayList<>(route); // Copy remaining waypoints BEFORE clearing route
                // Set current truck's route to only the depot
                route.clear(); // Clear the original list
                route.add(List.of(DEPOT_LOCATION.getLatitude(), DEPOT_LOCATION.getLongitude()));
                truck.setCurrentRoute(new ArrayList<>(route)); // Explicitly set the new route (copy is important)
                handleOverloadAssignment(truck, remainingRoute); // Try reassigning the COPY
                return; // Exit helper early, route has been changed

            } else if (justBecameOverloaded) { // Only trigger alert if just crossed 95% but not yet 100%
                String message = String.format("Truck '%s' (%s) is overloaded (%.1f%%). Continuing route.",
                        truck.getLicensePlate(), truck.getId(), newFillLevel);
                alertService.createAlert(Alert.AlertType.TRUCK_OVERLOADED, message, truck.getId());
            }
            // End Overload Check
        }

        // --- Check if route is now complete ---
        if (route.isEmpty()) {
            handleRouteCompletion(truck, isDepotWaypoint); // This will set route to null
        } else {
            // If route wasn't cleared by overload/completion, update truck's route field
            truck.setCurrentRoute(new ArrayList<>(route)); // Update with remaining waypoints (copy is important)
        }
    }

    // HELPER: Logic for completing a route (Clears route field)
    private void handleRouteCompletion(Truck truck, boolean arrivedAtDepot) {
        truck.setStatus(Truck.TruckStatus.IDLE);
        truck.setCurrentRoute(null); // ++ Explicitly set route to null ++
        System.out.println("Truck " + truck.getLicensePlate() + " completed route, now IDLE at " + (arrivedAtDepot ? "Depot" : "last stop") + ".");
        if (arrivedAtDepot) {
            truck.setCurrentFillLevel(0.0); // Empty truck at depot
            System.out.println("Truck " + truck.getLicensePlate() + " emptied at depot.");
        }
    }

    // HELPER: Move truck towards a target location
    private void moveTruckTowards(Truck truck, Bin.Location targetLocation) {
        Bin.Location currentLocation = truck.getCurrentLocation();
        double directionLat = targetLocation.getLatitude() - currentLocation.getLatitude();
        double directionLon = targetLocation.getLongitude() - currentLocation.getLongitude();
        double magnitude = Math.sqrt(directionLat * directionLat + directionLon * directionLon);

        if (magnitude > 1e-6) { // Avoid division by zero
            double normalizedLat = directionLat / magnitude;
            double normalizedLon = directionLon / magnitude;
            double stepLat = normalizedLat * (SIMULATION_STEP_KM / 111.32);
            double stepLon = normalizedLon * (SIMULATION_STEP_KM / (111.32 * Math.cos(Math.toRadians(currentLocation.getLatitude()))));
            currentLocation.setLatitude(currentLocation.getLatitude() + stepLat);
            currentLocation.setLongitude(currentLocation.getLongitude() + stepLon);
            truck.setCurrentLocation(currentLocation);
        } else { // Snap if already very close
            currentLocation.setLatitude(targetLocation.getLatitude());
            currentLocation.setLongitude(targetLocation.getLongitude());
            truck.setCurrentLocation(currentLocation);
        }
    }


    // HELPER: Handle route reassignment on overload
    private void handleOverloadAssignment(Truck overloadedTruck, List<List<Double>> remainingRoute) {
        if (remainingRoute == null || remainingRoute.isEmpty()) {
            System.out.println("Truck " + overloadedTruck.getLicensePlate() + " overloaded, but no remaining route to assign.");
            return;
        }
        List<Double> nextWaypointCoords = remainingRoute.get(0);
        Bin.Location nextWaypointLocation = createLocationFromCoords(nextWaypointCoords);
        if (nextWaypointLocation == null) { System.err.println("Could not determine next waypoint location for reassignment."); return; }

        List<Truck> idleTrucks = truckRepository.findAll().stream()
                .filter(t -> t.getStatus() == Truck.TruckStatus.IDLE && !t.getId().equals(overloadedTruck.getId()))
                .toList();
        if (idleTrucks.isEmpty()) { System.out.println("Truck " + overloadedTruck.getLicensePlate() + " overloaded, but no IDLE trucks available."); return; }

        Truck closestIdleTruck = idleTrucks.stream()
                .min(Comparator.comparingDouble(idleTruck ->
                        Node.calculateDistance(idleTruck.getCurrentLocation() != null ? idleTruck.getCurrentLocation() : DEPOT_LOCATION, nextWaypointLocation) ))
                .orElse(null);

        if (closestIdleTruck != null) {
            System.out.println("Reassigning remaining route from " + overloadedTruck.getLicensePlate() + " to " + closestIdleTruck.getLicensePlate());
            closestIdleTruck.setCurrentRoute(new ArrayList<>(remainingRoute)); // Assign a copy
            closestIdleTruck.setStatus(Truck.TruckStatus.EN_ROUTE);
            truckRepository.save(closestIdleTruck); // Save the newly assigned truck (happens within transaction)
            String message = String.format("Route from %s reassigned to %s due to overload.", overloadedTruck.getLicensePlate(), closestIdleTruck.getLicensePlate());
            alertService.createAlert(Alert.AlertType.ROUTE_DELAY, message, closestIdleTruck.getId());
        } else { System.out.println("Error: Could not find closest idle truck."); }
    }


    // HELPER: Random movement for unrouted trucks
    private void simulateRandomMovementForUnroutedTrucks() {
        List<Truck> randomMovers = truckRepository.findAll().stream()
                .filter(truck -> truck.getStatus() == Truck.TruckStatus.EN_ROUTE && (truck.getCurrentRoute() == null || truck.getCurrentRoute().isEmpty()))
                .toList();
        if (!randomMovers.isEmpty()){
            for (Truck truck : randomMovers) {
                Bin.Location currentLocation = truck.getCurrentLocation();
                if (currentLocation == null) { currentLocation = initializeLocationNear(DEPOT_LOCATION); }
                double latChange = (random.nextDouble() - 0.5) * 0.001; double lonChange = (random.nextDouble() - 0.5) * 0.001;
                currentLocation.setLatitude(currentLocation.getLatitude() + latChange); currentLocation.setLongitude(currentLocation.getLongitude() + lonChange);
                truck.setCurrentLocation(currentLocation);
                // Save individually here as it's outside the main transaction loop for active trucks
                truckRepository.save(truck);
            }
        }
    }

    // --- Utility Helpers ---
    private Bin.Location createLocationFromCoords(List<Double> coords) {
        if (coords == null || coords.size() < 2 || coords.get(0) == null || coords.get(1) == null) return null;
        Bin.Location loc = new Bin.Location();
        loc.setLatitude(coords.get(0)); loc.setLongitude(coords.get(1)); return loc;
    }
    private Bin.Location initializeLocationNear(Bin.Location target) {
        Bin.Location start = new Bin.Location();
        Bin.Location reference = (target != null) ? target : DEPOT_LOCATION;
        start.setLatitude(reference.getLatitude() + (random.nextDouble() - 0.5) * 0.001); // Start nearby
        start.setLongitude(reference.getLongitude() + (random.nextDouble() - 0.5) * 0.001); return start;
    }
    private boolean isLocationEqual(Bin.Location loc1, Bin.Location loc2) {
        if (loc1 == null || loc2 == null) return false;
        double tolerance = 1e-6; // Tolerance for floating point comparison
        return Math.abs(loc1.getLatitude() - loc2.getLatitude()) < tolerance &&
                Math.abs(loc1.getLongitude() - loc2.getLongitude()) < tolerance;
    }
    // ++ NEW HELPER: Find Bin by Location (needed for emptying) ++
    private Optional<Bin> findBinByLocation(Bin.Location targetLocation) {
        if (targetLocation == null) return Optional.empty();
        // Find bin where location matches closely (using tolerance)
        // Note: This could be inefficient if there are many bins.
        // A spatial index in MongoDB would be better for a real application.
        return binRepository.findAll().stream()
                .filter(bin -> bin.getLocation() != null &&
                        isLocationEqual(bin.getLocation(), targetLocation))
                .findFirst();
    }
}