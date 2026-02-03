'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
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

function MapController({ onLocationSelect, initialPosition }: { onLocationSelect: (location: LocationData) => void; initialPosition?: [number, number] }) {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(() => initialPosition ? L.latLng(initialPosition[0], initialPosition[1]) : null);
  const markerRef = useRef<LeafletMarker>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if(initialPosition && !position) {
        const initialLatLng = L.latLng(initialPosition[0], initialPosition[1]);
        setPosition(initialLatLng);
        map.flyTo(initialLatLng, 15);
    }
  }, [initialPosition, position, map]);


  // Add search control
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: 'bar',
      showMarker: false,
      autoClose: true,
    });
    map.addControl(searchControl);
    
    const onResult = (e: any) => {
        const newPos = L.latLng(e.location.y, e.location.x);
        setPosition(newPos);
        map.flyTo(newPos, 15);
    }
    map.on('geosearch/showlocation', onResult);

    return () => {
        map.removeControl(searchControl)
        map.off('geosearch/showlocation', onResult);
    };
  }, [map]);

  // Handle map clicks
  useEffect(() => {
    const onClick = (e: L.LeafletMouseEvent) => {
      if(!isDragging.current) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      }
    }
    map.on('click', onClick);
    return () => { map.off('click', onClick) };
  }, [map]);

  const markerEventHandlers = useMemo(() => ({
    dragstart: () => {
        isDragging.current = true;
    },
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        setPosition(marker.getLatLng());
      }
      setTimeout(() => { isDragging.current = false; }, 50);
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


  return position ? (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      eventHandlers={markerEventHandlers}
    />
  ) : null;
}

export function LocationSelector({ onLocationSelect, initialPosition }: LocationSelectorProps) {
  const mapCenter: [number, number] = initialPosition || [23.8103, 90.4125];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController onLocationSelect={onLocationSelect} initialPosition={initialPosition} />
      </MapContainer>
    </div>
  );
}
