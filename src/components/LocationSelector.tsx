'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import type { Marker as LeafletMarker, LatLngExpression, Icon } from 'leaflet';
import L from 'leaflet';

// Fix for default Leaflet icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const searchControl = new GeoSearchControl({
  provider: new OpenStreetMapProvider(),
  style: 'bar',
  showMarker: false,
  autoClose: true,
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

const SearchField = ({ onResult }: { onResult: (result: any) => void }) => {
  const map = useMap();

  useEffect(() => {
    map.addControl(searchControl);
    const onShowLocation = (e: any) => {
        onResult(e.location);
    };
    map.on('geosearch/showlocation', onShowLocation);
    return () => {
        map.off('geosearch/showlocation', onShowLocation);
        map.removeControl(searchControl);
    };
  }, [map, onResult]);

  return null;
};

const MapEvents = ({ onMapChange }: { onMapChange: (latlng: {lat: number, lng: number}) => void }) => {
    const markerRef = useRef<LeafletMarker>(null);

    const map = useMapEvents({
        click(e) {
            onMapChange(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return null;
}

export function LocationSelector({ onLocationSelect, initialPosition }: LocationSelectorProps) {
  const [position, setPosition] = useState<[number, number]>(initialPosition || [23.8103, 90.4125]);
  const markerRef = useRef<LeafletMarker>(null);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition([newPos.lat, newPos.lng]);
      }
    },
  }), []);

  const handleMapChange = (latlng: {lat: number, lng: number}) => {
    setPosition([latlng.lat, latlng.lng]);
  };
  
  const handleSearchResult = (location: any) => {
    setPosition([location.y, location.x]);
    const map = markerRef.current?.getMap();
    if(map) {
        map.flyTo([location.y, location.x], 15);
    }
  };

  useEffect(() => {
    const reverseGeocode = async () => {
      try {
        const response = await fetch(`/api/geocode/reverse?lat=${position[0]}&lon=${position[1]}`);
        if (!response.ok) {
            throw new Error('Failed to fetch address from proxy.');
        }
        const data = await response.json();
        const addressLabel = data.display_name || 'Address not found';
        onLocationSelect({
            lat: position[0],
            lng: position[1],
            address: addressLabel,
        });
      } catch (error) {
        console.error("Reverse geocoding failed", error);
        onLocationSelect({
            lat: position[0],
            lng: position[1],
            address: 'Could not determine address'
        });
      }
    };
    reverseGeocode();
  }, [position, onLocationSelect]);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden relative">
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          draggable={true} 
          eventHandlers={eventHandlers} 
          position={position} 
          ref={markerRef}
        />
        <SearchField onResult={handleSearchResult} />
        <MapEvents onMapChange={handleMapChange} />
      </MapContainer>
    </div>
  );
}
