import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(ref?: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const app = useFirebaseApp();
  const db = useFirestore();

  const modifiedRef = useMemo(() => {
    if (!ref || !app.options.projectId) {
      return ref;
    }
    
    const segments = (ref as any)._path.segments as string[];
    if (!segments || segments.length === 0 || segments[0] === 'artifacts') {
      return ref; // Already prefixed or empty path
    }

    let newPath;
     if (segments[0] === 'users' && segments.length > 1) {
        newPath = `artifacts/${app.options.projectId}/${segments.join('/')}`;
    } else {
        newPath = `artifacts/${app.options.projectId}/public/data/${segments.join('/')}`;
    }

    return doc(db, newPath);

  }, [ref, app.options.projectId, db]);


  useEffect(() => {
    if (modifiedRef) {
      const unsubscribe = onSnapshot(
        modifiedRef,
        (doc) => {
          if (doc.exists()) {
            setData({ id: doc.id, ...doc.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        async (err) => {
          const permissionError = new FirestorePermissionError({
            path: modifiedRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setData(null);
      setLoading(false);
    }
  }, [modifiedRef]);

  return { data, loading, error };
}
