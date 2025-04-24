import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { NodeData } from "../utils/NodeData";

// Define the shape of a marker
interface Marker {
  long_name: string;
  short_name: string;
  coordinates: [number, number]; // [latitude, longitude]
}

interface WorldMapProps {
  nodes: NodeData[];
}

// Hook to dynamically adjust map bounds and invalidate size
const MapAdjuster: React.FC<{ markers: Marker[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size to ensure tiles load correctly
    map.invalidateSize();

    // Filter out invalid coordinates and ensure markers array is not empty
    const validMarkers = markers.filter((marker) => {
      const [lat, lon] = marker.coordinates;
      return (
        typeof lat === "number" &&
        typeof lon === "number" &&
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      );
    });

    //console.log("Valid markers for bounds:", validMarkers);

    if (validMarkers.length > 0) {
      const bounds = L.latLngBounds(
        validMarkers.map((marker) => L.latLng(marker.coordinates))
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    } else {
      console.warn("No valid markers to set bounds. Using default view.");
    }
  }, [markers, map]);

  return null;
};

function WorldMap({ nodes }: WorldMapProps) {
  // Convert microdegrees to decimal degrees and apply scaling factor
  const markers: Marker[] = nodes
    .filter(
      (node) => node.longitude !== undefined && node.latitude !== undefined
    )
    .map((node) => {
      const { longName, shortName, latitude, longitude } = node;
      // Convert from microdegrees to decimal degrees (fixed divisor)

      const lat = latitude! / 1_000_0000;
      const lon = longitude! / 1_000_0000;
      // Log for debugging
      //console.log(`Node: ${longName || "Unknown"} - Lat: ${lat}, Lon: ${lon}`);
      return {
        long_name: longName || "Unknown",
        short_name: shortName || "????",
        coordinates: [lat, lon], // [latitude, longitude]
      };
    });

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full mx-auto mt-4">
      <h1 className="text-2xl font-bold mb-4 text-center text-black">
        Map of Nodes
      </h1>
      <MapContainer
        center={[65, 25]} // Center on Finland
        style={{ height: "600px", width: "100%", minHeight: "600px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapAdjuster markers={markers} />
        {markers.map(({ long_name, short_name, coordinates }, index) => {
          const [lat, lon] = coordinates;
          // Skip rendering markers with invalid coordinates
          if (
            typeof lat !== "number" ||
            typeof lon !== "number" ||
            isNaN(lat) ||
            isNaN(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            console.warn(
              `Skipping marker ${long_name}-${short_name} due to invalid coordinates: [${lat}, ${lon}]`
            );
            return null;
          }
          return (
            <CircleMarker
              key={index}
              center={coordinates}
              radius={5}
              fillColor="red"
              color="white"
              weight={1}
              fillOpacity={1}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.setStyle({ radius: 8, fillColor: "darkred" });
                },
                mouseout: (e) => {
                  e.target.setStyle({ radius: 5, fillColor: "red" });
                },
              }}
            >
              <Tooltip>{`${long_name} - ${short_name}`}</Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default WorldMap;
