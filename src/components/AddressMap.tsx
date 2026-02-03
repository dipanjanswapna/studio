'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Address } from '@/pages/profile/addresses';

// This is a common fix for a bug in React-Leaflet with Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});


const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const defaultCenter: [number, number] = [23.8103, 90.4125];

export default function AddressMap({ addresses }: { addresses: Address[] }) {

    const mapCenter = useMemo(() => {
        const validAddresses = addresses.filter(a => a.latitude && a.longitude);
        if (validAddresses.length > 0) {
            return [validAddresses[0].latitude!, validAddresses[0].longitude!] as [number, number];
        }
        return defaultCenter;
    }, [addresses]);

    return (
        <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden">
            <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={mapContainerStyle}
            >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <>
                  {addresses.map(addr => (
                      addr.latitude && addr.longitude && (
                          <Marker
                              key={addr.id}
                              position={[addr.latitude, addr.longitude]}
                          >
                            <Popup>
                                <h4 className="font-bold">{addr.name} ({addr.type})</h4>
                                <p className="text-sm">{addr.address}</p>
                            </Popup>
                          </Marker>
                      )
                  ))}
                </>
            </MapContainer>
        </div>
    );
}