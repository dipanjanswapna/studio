'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import type { Marker as LeafletMarker } from 'leaflet';
import L from 'leaflet';

// Fix for default Leaflet icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: LocationData) => void;
  initialPosition?: [number, number];
}

// This component will handle all map interactions
function MapInteractionController({ setPosition }: { setPosition: (pos: L.LatLng) => void }) {
    const map = useMap();

    // Handle search
    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider,
            style: 'bar',
            showMarker: false, // We'll manage our own marker
            autoClose: true,
        });

        map.addControl(searchControl);

        const onShowLocation = (e: any) => {
            setPosition(L.latLng(e.location.y, e.location.x));
            map.flyTo([e.location.y, e.location.x], 15);
        };
        
        map.on('geosearch/showlocation', onShowLocation);

        return () => {
            map.removeControl(searchControl);
            map.off('geosearch/showlocation', onShowLocation);
        };
    }, [map, setPosition]);

    // Handle map clicks
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return null;
}

export function LocationSelector({ onLocationSelect, initialPosition }: LocationSelectorProps) {
  const [position, setPosition] = useState<L.LatLng | null>(initialPosition ? L.latLng(initialPosition[0], initialPosition[1]) : null);
  const markerRef = useRef<LeafletMarker>(null);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        setPosition(marker.getLatLng());
      }
    },
  }), []);

  // Reverse geocode when position changes
  useEffect(() => {
    if (!position) return;
    
    const provider = new OpenStreetMapProvider();
    const reverseGeocode = async () => {
      try {
        const results = await provider.search({ query: `${position.lat},${position.lng}` });
        const addressLabel = results.length > 0 ? (results[0].label as string) : 'Address not found';
        onLocationSelect({
            lat: position.lat,
            lng: position.lng,
            address: addressLabel,
        });
      } catch (error) {
        console.error("Reverse geocoding failed", error);
        onLocationSelect({
            lat: position.lat,
            lng: position.lng,
            address: 'Could not determine address'
        });
      }
    };
    reverseGeocode();
  }, [position, onLocationSelect]);

  const mapCenter = position ? [position.lat, position.lng] : initialPosition || [23.8103, 90.4125];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden relative">
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
            <Marker 
              draggable={true} 
              eventHandlers={eventHandlers} 
              position={position} 
              ref={markerRef}
            />
        )}
        <MapInteractionController setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}