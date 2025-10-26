package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.Bin;
import com.smartwaste.adminbackend.model.Truck;
import com.smartwaste.adminbackend.repository.BinRepository;
import com.smartwaste.adminbackend.repository.TruckRepository;
import com.smartwaste.adminbackend.routing.Dijkstra;
import com.smartwaste.adminbackend.routing.Graph;
import com.smartwaste.adminbackend.routing.Node;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

@Service
public class RoutingService {

    @Autowired
    private BinRepository binRepository;

    @Autowired
    private TruckRepository truckRepository;

    // Depot: Colombo Municipal Council
    private final Bin.Location DEPOT_LOCATION = new Bin.Location() {{
        setLatitude(6.9135);
        setLongitude(79.8601);
    }};

    public List<Node> generateOptimalRoute(String truckId) {
        // 1. Get truck & validate location
        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new RuntimeException("Truck not found"));
        if (truck.getCurrentLocation() == null || truck.getCurrentLocation().getLatitude() == 0 || truck.getCurrentLocation().getLongitude() == 0) {
            throw new RuntimeException("Selected truck has an invalid starting location.");
        }
        Node truckNode = new Node(truck.getId(), truck.getCurrentLocation());

        // 2. Get bins > 85% full with valid locations
        List<Bin> fullBins = binRepository.findAll().stream()
                .filter(bin -> bin.getFillLevel() != null && bin.getFillLevel() > 85 &&
                        bin.getLocation() != null && bin.getLocation().getLatitude() != 0 && bin.getLocation().getLongitude() != 0)
                .toList();

        if (fullBins.isEmpty()) {
            throw new RuntimeException("No valid full bins found to generate a route.");
        }

        // 3. Create nodes
        Node depotNode = new Node("DEPOT", DEPOT_LOCATION);
        Set<Node> binNodes = new HashSet<>();
        for (Bin bin : fullBins) {
            // Ensure bin location isn't null before creating node
            if(bin.getLocation() != null){
                binNodes.add(new Node(bin.getId(), bin.getLocation()));
            }
        }

        // --- Greedy Dijkstra Approach ---
        List<Node> optimalRoute = new ArrayList<>();
        Node currentNode = truckNode;
        optimalRoute.add(currentNode);

        while (!binNodes.isEmpty()) {
            Graph graph = new Graph();
            currentNode.setAdjacentNodes(new HashMap<>()); // Reset connections
            currentNode.setDistance(0.0); // Reset distance for source node
            graph.addNode(currentNode);

            for (Node binNode : binNodes) {
                // Ensure locations are valid before calculating distance
                if (currentNode.getLocation() != null && binNode.getLocation() != null) {
                    double dist = Node.calculateDistance(currentNode.getLocation(), binNode.getLocation());
                    if (dist != Double.MAX_VALUE) { // Only add reachable nodes
                        currentNode.addDestination(binNode, dist);
                    }
                }
                // Reset bin node for Dijkstra
                binNode.setDistance(Double.MAX_VALUE);
                binNode.setShortestPath(new LinkedList<>());
                graph.addNode(binNode);
            }

            // Run Dijkstra
            graph = Dijkstra.calculateShortestPathFromSource(graph, currentNode);

            // Find closest reachable bin
            Node closestBin = null;
            double minDistance = Double.MAX_VALUE;
            for (Node node : graph.getNodes()) {
                if (node.equals(currentNode)) continue;
                if (!node.getDistance().equals(Double.MAX_VALUE) && node.getDistance() < minDistance) {
                    minDistance = node.getDistance();
                    closestBin = node;
                }
            }

            if (closestBin == null) break; // No more reachable bins

            optimalRoute.add(closestBin);
            // Re-create currentNode cleanly for the next iteration
            currentNode = new Node(closestBin.getId(), closestBin.getLocation());
            // Use effectively final variable for lambda
            final Node binToRemove = closestBin;
            binNodes.removeIf(node -> node.getId().equals(binToRemove.getId()));
        }

        // 6. Add depot
        optimalRoute.add(depotNode);
        return optimalRoute;
    }
}