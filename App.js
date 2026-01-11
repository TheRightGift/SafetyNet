import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './src/database/firebase';

import AuthScreen from './src/screens/AuthScreen';
import DependentHomeScreen from './src/screens/DependentHomeScreen';
import GuardianHomeScreen from './src/screens/GuardianHomeScreen';
import LocationDisclosureScreen from './src/screens/LocationDisclosureScreen';
import { LoadingOverlay } from './src/components/LoadingOverlay';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) setRole(userDoc.data().role);
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <LoadingOverlay visible={true} />;

  if (!user) return <AuthScreen />;

  // Dependent safety flow: Disclosure -> App
  if (role === 'dependent' && !disclosureAccepted) {
    return <LocationDisclosureScreen onAccept={() => setDisclosureAccepted(true)} />;
  }

  return role === 'guardian' ? <GuardianHomeScreen /> : <DependentHomeScreen />;
}