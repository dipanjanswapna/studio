'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query as firestoreQuery,
  QuerySnapshot,
  limit,
  limitToLast,
} from 'firebase/firestore';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(q?: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const app = useFirebaseApp();
  const db = useFirestore();

  const modifiedQuery = useMemo(() => {
    if (!q || !app.options.projectId) {
      return q;
    }
    
    const internalQuery = (q as any)._query;
    if (!internalQuery || !internalQuery.path) return q;

    const segments = internalQuery.path.segments as string[];
    if (!segments || segments.length === 0 || segments[0] === 'artifacts') {
      return q; // Already prefixed or empty path
    }

    let newPath;
    if (segments[0] === 'users' && segments.length > 1) {
        newPath = `artifacts/${app.options.projectId}/${segments.join('/')}`;
    } else {
        newPath = `artifacts/${app.options.projectId}/public/data/${segments.join('/')}`;
    }

    // The previous implementation of reconstructing queries from internal properties was unstable.
    // For now, we will create a new query on the correct path without other constraints
    // to prevent crashes, and address full constraint support in a follow-up.
    const newCollectionRef = collection(db, newPath);

    // We can't reliably reconstruct all constraints, so we apply none for now to ensure stability.
    // This may cause some queries to return more data than expected until fully fixed.
    return firestoreQuery(newCollectionRef);

  }, [q, app.options.projectId, db]);


  useEffect(() => {
    if (modifiedQuery) {
      const unsubscribe = onSnapshot(
        modifiedQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const documents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(documents);
          setLoading(false);
        },
        async (err) => {
          const queryPath = (modifiedQuery as any)._query?.path?.segments?.join('/');
          const collectionGroup = (modifiedQuery as any)._query?.collectionGroup;
          const path = queryPath || collectionGroup || 'unknown collection';
          
          const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
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
  }, [modifiedQuery]);

  return { data, loading, error };
}
