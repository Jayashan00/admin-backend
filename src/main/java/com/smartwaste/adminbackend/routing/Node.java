package com.smartwaste.adminbackend.routing;

import com.smartwaste.adminbackend.model.Bin;
import lombok.Data;
import lombok.EqualsAndHashCode; // ++ Import Exclude ++

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

@Data // Keep @Data for getters/setters/toString
public class Node {

    private String id;
    private Bin.Location location;

    // --- Dijkstra Algorithm fields ---

    @EqualsAndHashCode.Exclude // ++ Exclude from equals/hashCode ++
    private Map<Node, Double> adjacentNodes = new HashMap<>();

    @EqualsAndHashCode.Exclude // ++ Exclude from equals/hashCode ++
    private List<Node> shortestPath = new LinkedList<>();

    private Double distance = Double.MAX_VALUE;

    public Node(String id, Bin.Location location) {
        this.id = id;
        this.location = location;
    }

    public void addDestination(Node destination, double distance) {
        adjacentNodes.put(destination, distance);
    }

    // Helper function to calculate straight-line distance (Haversine formula in km)
    public static double calculateDistance(Bin.Location loc1, Bin.Location loc2) {
        if (loc1 == null || loc2 == null) return Double.MAX_VALUE; // Safety check
        double R = 6371; // Radius of the Earth in km

        double latDistance = Math.toRadians(loc2.getLatitude() - loc1.getLatitude());
        double lonDistance = Math.toRadians(loc2.getLongitude() - loc1.getLongitude());

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(loc1.getLatitude())) * Math.cos(Math.toRadians(loc2.getLatitude()))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in km
    }
}