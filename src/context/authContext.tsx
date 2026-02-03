import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useFirebaseApp } from "@/firebase";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type UserRole = "ADMIN" | "VENDOR" | "OUTLET" | "STAFF" | "CUSTOMER" | "B2B_CUSTOMER";

export interface User {
  uid: string;
  email: string | null;
  name?: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  membershipId?: string;
  membershipTier?: "Gold" | "Platinum" | "Diamond";
  companyName?: string;
  vatNumber?: string;
  storeDescription?: string;
  outletAddress?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; name: string; pass: string, role: UserRole }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const redirectByRole = (role: UserRole, router: any) => {
  switch (role) {
    case "ADMIN":
      router.push("/portal/admin");
      break;
    case "VENDOR":
      router.push("/portal/vendor");
      break;
    case "OUTLET":
      router.push("/portal/outlet");
      break;
    case "STAFF":
      router.push("/portal/staff");
      break;
    case "B2B_CUSTOMER":
    case "CUSTOMER":
    default:
      router.push("/profile");
      break;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          // Sync photoURL if it's different
          if (fbUser.photoURL && userData.photoURL !== fbUser.photoURL) {
              await updateDoc(userDocRef, { photoURL: fbUser.photoURL });
              setUser({ ...userData, photoURL: fbUser.photoURL });
          } else {
              setUser(userData);
          }
        } else {
          // This case handles users who signed up before Firestore profiles were implemented
          // Or if a user document was deleted for some reason.
          console.warn("User document not found in Firestore, creating a default one.");
          const role: UserRole = fbUser.email?.includes('admin') ? 'ADMIN' : 'CUSTOMER';
          const newUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split('@')[0],
            photoURL: fbUser.photoURL || undefined,
            role: role,
            membershipId: `AVZ-CUS-${Math.floor(Math.random() * 90000) + 10000}`,
            membershipTier: 'Gold'
          };
          
          setDoc(doc(db, 'users', fbUser.uid), newUser, { merge: true }).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: `users/${fbUser.uid}`,
                    operation: 'create',
                    requestResourceData: newUser,
                });
                errorEmitter.emit('permission-error', permissionError);
           });
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);
  
  const login = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle fetching the profile and setting state.
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let role: UserRole = 'CUSTOMER';
      if (userDocSnap.exists()) {
        role = (userDocSnap.data() as User).role || 'CUSTOMER';
      }

      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting...`,
      });
      redirectByRole(role, router);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let role: UserRole = 'CUSTOMER'; // Default role for new Google sign-ups

        if (!userDocSnap.exists()) {
            // New user, create a profile
            const newUser: User = {
                uid: fbUser.uid,
                email: fbUser.email,
                name: fbUser.displayName || fbUser.email?.split('@')[0],
                photoURL: fbUser.photoURL || undefined,
                role: role,
                membershipId: `AVZ-CUS-${Math.floor(Math.random() * 90000) + 10000}`,
                membershipTier: 'Gold'
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser)
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: `users/${fbUser.uid}`,
                        operation: 'create',
                        requestResourceData: newUser,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            setUser(newUser); // Set user state immediately
        } else {
             const userData = userDocSnap.data() as User;
             role = userData.role || 'CUSTOMER';
             // If existing user, onAuthStateChanged will handle photoURL sync
        }

        toast({
            title: "Login Successful",
            description: `Welcome, ${fbUser.displayName}!`,
        });
        redirectByRole(role, router);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Login Failed",
            description: error.message || "An unexpected error occurred.",
        });
    }
  };

  const register = async (data: { email: string; name: string; pass: string, role: UserRole }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const fbUser = userCredential.user;

      const newUser: User = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: data.name,
        role: data.role,
        membershipId: `AVZ-CUS-${Math.floor(Math.random() * 90000) + 10000}`,
        membershipTier: 'Gold'
      };

      await setDoc(doc(db, 'users', fbUser.uid), newUser)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
            path: `users/${fbUser.uid}`,
            operation: 'create',
            requestResourceData: newUser,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

      toast({
            title: "Registration Successful",
            description: "Welcome! You are now logged in.",
      });
      redirectByRole(data.role, router);
    } catch (error: any) {
      toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/auth/login");
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    }
  };
  
  const updateUser = useCallback((data: Partial<User>) => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    // Update local state immediately for instant UI feedback
    setUser(currentUser => currentUser ? { ...currentUser, ...data } : null);

    setDoc(userDocRef, data, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }, [user, db, toast]);

  const value = { user, firebaseUser, login, register, logout, loginWithGoogle, updateUser, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
