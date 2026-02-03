'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Home, Briefcase, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddressModal } from '@/components/modals/AddressModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/authContext';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: {type: 'spring', stiffness: 100} },
};

export type Address = {
    id: string;
    type: 'Home' | 'Office';
    isDefault: boolean;
    name: string;
    address: string;
    city: string;
    phone: string;
    latitude?: number;
    longitude?: number;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const defaultCenter: [number, number] = [23.8103, 90.4125];

function AddressMap({ addresses }: { addresses: Address[] }) {
    // Fix for default Leaflet icon issue with webpack
    const leafletIcon = L.icon({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
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
                <MarkerClusterGroup chunkedLoading>
                  {addresses.map(addr => (
                      addr.latitude && addr.longitude && (
                          <Marker
                              key={addr.id}
                              position={[addr.latitude, addr.longitude]}
                              icon={leafletIcon}
                          >
                            <Popup>
                                <h4 className="font-bold">{addr.name} ({addr.type})</h4>
                                <p className="text-sm">{addr.address}</p>
                            </Popup>
                          </Marker>
                      )
                  ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}

const DynamicAddressMap = dynamic(() => Promise.resolve(AddressMap), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full" />,
});


export default function AddressesPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const addressesRef = user ? collection(db, 'users', user.uid, 'addresses') : null;
  const addressesQuery = useMemo(() => addressesRef ? query(addressesRef) : undefined, [addressesRef]);
  const { data: addresses, loading } = useCollection<Address>(addressesQuery);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const { toast } = useToast();

  const handleOpenModal = (address: Address | null = null) => {
    setAddressToEdit(address);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAddressToEdit(null);
  };
  
  const handleSaveAddress = async (addressData: Omit<Address, 'id'>) => {
    if (!user || !addressesRef || !addresses) return;

    try {
        if (addressData.isDefault) {
          const batch = writeBatch(db);
          const currentDefault = addresses.find(addr => addr.isDefault);
          if (currentDefault) {
              const currentDefaultRef = doc(db, 'users', user.uid, 'addresses', currentDefault.id);
              batch.update(currentDefaultRef, { isDefault: false });
          }
          await batch.commit();
        }

        if (addressToEdit) {
            const addressRef = doc(db, 'users', user.uid, 'addresses', addressToEdit.id);
            await updateDoc(addressRef, addressData);
            toast({ title: "Address Updated", description: "Your address has been successfully updated." });
        } else {
            await addDoc(addressesRef, addressData);
            toast({ title: "Address Added", description: "Your new address has been saved." });
        }
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/addresses/${addressToEdit?.id || ''}`,
            operation: addressToEdit ? 'update' : 'create',
            requestResourceData: addressData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Operation Failed", description: "Could not save address." });
    }
  };

  const handleDeleteAddress = async (addressToDelete: Address) => {
      if (!user || !addresses) return;
      
      try {
          const addressRef = doc(db, 'users', user.uid, 'addresses', addressToDelete.id);
          await deleteDoc(addressRef);
          
          if (addressToDelete.isDefault && addresses.length > 1) {
              const nextAddress = addresses.find(a => a.id !== addressToDelete.id);
              if (nextAddress) {
                const nextAddressRef = doc(db, 'users', user.uid, 'addresses', nextAddress.id);
                await updateDoc(nextAddressRef, { isDefault: true });
              }
          }
          toast({ title: "Address Deleted", variant: "destructive", description: "The address has been removed." });
      } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/addresses/${addressToDelete.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete address." });
      }
  };
  
  const handleSetAsDefault = async (addressToMakeDefault: Address) => {
      if (!user || !addresses) return;
      const batch = writeBatch(db);
      
      const currentDefault = addresses.find(addr => addr.isDefault);
      if (currentDefault && currentDefault.id !== addressToMakeDefault.id) {
          const currentDefaultRef = doc(db, 'users', user.uid, 'addresses', currentDefault.id);
          batch.update(currentDefaultRef, { isDefault: false });
      }

      const newDefaultRef = doc(db, 'users', user.uid, 'addresses', addressToMakeDefault.id);
      batch.update(newDefaultRef, { isDefault: true });
      
      try {
        await batch.commit();
        toast({ title: "Default Address Changed", description: "Your default shipping address has been updated." });
      } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/addresses`,
                operation: 'update',
                requestResourceData: { isDefault: true },
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Operation Failed", description: "Could not set default address." });
      }
  };


  return (
    <>
      <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                  <Card>
                      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                              <CardTitle>Manage Addresses</CardTitle>
                              <CardDescription>Add, edit, or remove your shipping addresses.</CardDescription>
                          </div>
                          <Button className="w-full sm:w-auto" onClick={() => handleOpenModal()}>
                              <Plus className="mr-2 h-4 w-4" /> Add New Address
                          </Button>
                      </CardHeader>
                      <CardContent>
                          {loading ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Skeleton className="h-48 w-full" />
                              <Skeleton className="h-48 w-full" />
                              </div>
                          ) : !addresses || addresses.length === 0 ? (
                              <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-secondary/50">
                                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                  <h2 className="mt-4 text-xl font-semibold">No addresses saved</h2>
                                  <p className="mt-1 text-muted-foreground">
                                      Add a new address to make your checkout process faster.
                                  </p>
                              </div>
                          ) : (
                              <div className="grid grid-cols-1 gap-4">
                                  {addresses.map((addr) => (
                                      <Card key={addr.id} className="flex flex-col">
                                          <CardHeader className="flex flex-row items-start justify-between">
                                              <div className="flex items-center gap-3">
                                                  {addr.type === 'Home' ? <Home className="h-5 w-5 text-muted-foreground" /> : <Briefcase className="h-5 w-5 text-muted-foreground" />}
                                                  <h3 className="font-semibold text-lg">{addr.type}</h3>
                                                  {addr.isDefault && <Badge>Default</Badge>}
                                              </div>
                                              <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                                                          <MoreVertical className="h-4 w-4" />
                                                      </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                      {!addr.isDefault && <DropdownMenuItem onClick={() => handleSetAsDefault(addr)}>Set as Default</DropdownMenuItem>}
                                                      <DropdownMenuItem onClick={() => handleOpenModal(addr)}>Edit</DropdownMenuItem>
                                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteAddress(addr)}>Delete</DropdownMenuItem>
                                                  </DropdownMenuContent>
                                              </DropdownMenu>
                                          </CardHeader>
                                          <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                                              <p className="font-medium text-foreground">{addr.name}</p>
                                              <p>{addr.address}</p>
                                              <p>{addr.city}</p>
                                              <p>Phone: {addr.phone}</p>
                                          </CardContent>
                                      </Card>
                                  ))}
                              </div>
                          )}
                      </CardContent>
                  </Card>
              </div>
               <div className="lg:col-span-1 lg:sticky top-28">
                  <Card>
                      <CardHeader>
                          <CardTitle>Address Map</CardTitle>
                          <CardDescription>Visual representation of your saved addresses.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <DynamicAddressMap addresses={addresses || []} />
                      </CardContent>
                  </Card>
              </div>
          </div>
      </motion.div>
    <AddressModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAddress} addressToEdit={addressToEdit} />
    </>
  );
}
