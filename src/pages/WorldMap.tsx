import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
//import L from "leaflet";

import { NodeData } from "../utils/NodeData";
import { isMqttUpdated } from "../utils/mqttChecks";
import NodeInfoPopup from "../components/NodeInfoPopup";

// Define the shape of a marker
interface Marker {
  long_name: string;
  short_name: string;
  coordinates: [number, number]; // [latitude, longitude]
  mqttUpdated?: Date | string;
}

interface WorldMapProps {
  nodes: NodeData[];
}

// Hook to dynamically adjust map bounds and invalidate size
// const MapAdjuster: React.FC<{ markers: Marker[] }> = ({ markers }) => {
//   const map = useMap();

//   useEffect(() => {
//     // Invalidate map size to ensure tiles load correctly
//     map.invalidateSize();

//     // Filter out invalid coordinates and ensure markers array is not empty
//     const validMarkers = markers.filter((marker) => {
//       const [lat, lon] = marker.coordinates;
//       return (
//         typeof lat === "number" &&
//         typeof lon === "number" &&
//         !isNaN(lat) &&
//         !isNaN(lon) &&
//         lat >= -90 &&
//         lat <= 90 &&
//         lon >= -180 &&
//         lon <= 180
//       );
//     });

//     //console.log("Valid markers for bounds:", validMarkers);

//     if (validMarkers.length > 0) {
//       const bounds = L.latLngBounds(
//         validMarkers.map((marker) => L.latLng(marker.coordinates))
//       );
//       map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
//     } else {
//       console.warn("No valid markers to set bounds. Using default view.");
//     }
//   }, [markers, map]);

//   return null;
// };

const ZoomScaledMarkers: React.FC<{ markers: Marker[] }> = ({ markers }) => {
  const [showPopup, setShowPopup] = useState(false);

  const map = useMap();
  const [radius, setRadius] = useState(6); // Base radius at default zoom
  const baseZoom = 7; // Default zoom level where radius is 5

  useEffect(() => {
    const updateRadius = () => {
      const currentZoom = map.getZoom();
      // Scale radius linearly: radius = baseRadius * (currentZoom / baseZoom)
      const newRadius = 5 * Math.pow(1.2, currentZoom - baseZoom);
      setRadius(Math.min(15, Math.max(6, newRadius)));
    };

    // Initial radius
    updateRadius();

    // Update radius on zoom change
    map.on("zoomend", updateRadius);

    // Cleanup event listener on unmount
    return () => {
      map.off("zoomend", updateRadius);
    };
  }, [map]);

  return (
    <>
      <NodeInfoPopup
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
        }}
      />
      {markers.map(
        ({ long_name, short_name, coordinates, mqttUpdated }, index) => {
          const [lat, lon] = coordinates;
          const isUpdated = isMqttUpdated({
            date: mqttUpdated ? new Date(mqttUpdated) : undefined,
          });
          const notHovering = isUpdated ? "green" : "red";
          const Hovering = isUpdated ? "darkgreeb" : "darkred";
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
              radius={radius} // Use zoom-adjusted radius
              fillColor={notHovering}
              color="white"
              weight={1}
              fillOpacity={1}
              eventHandlers={{
                click: () => {
                  setShowPopup(true);
                },
                mouseover: (e) => {
                  e.target.setStyle({
                    radius: radius * 1.6,
                    fillColor: Hovering,
                  }); // Scale hover radius relative to current radius
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    radius: radius,
                    fillColor: notHovering,
                  });
                },
              }}
            >
              <Tooltip>{`${long_name} - ${short_name}`}</Tooltip>
            </CircleMarker>
          );
        }
      )}
    </>
  );
};

function WorldMap({ nodes }: WorldMapProps) {
  // Convert microdegrees to decimal degrees and apply scaling factor
  const markers: Marker[] = nodes
    .filter(
      (node) => node.longitude !== undefined && node.latitude !== undefined
    )
    .map((node) => {
      const { longName, shortName, latitude, longitude, mqtt_updated_at } =
        node;
      // Convert from microdegrees to decimal degrees (fixed divisor)

      const lat = latitude! / 1_000_0000;
      const lon = longitude! / 1_000_0000;
      // Log for debugging
      //console.log(`Node: ${longName || "Unknown"} - Lat: ${lat}, Lon: ${lon}`);
      return {
        long_name: longName || "Unknown",
        short_name: shortName || "????",
        coordinates: [lat, lon], // [latitude, longitude]
        mqttUpdated: mqtt_updated_at ? new Date(mqtt_updated_at) : undefined,
      };
    });

  return (
    <div className="absolute top-15 bottom-0 left-0 right-0 content-center justify-center">
      <MapContainer
        center={[65, 25]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* {<MapAdjuster markers={markers} />} */}
        <ZoomScaledMarkers markers={markers} />
      </MapContainer>
    </div>
  );
}

export default WorldMap;
