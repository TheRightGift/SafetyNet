import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './src/database/firebase';

import AuthScreen from './src/screens/AuthScreen';
import DependentHomeScreen from './src/screens/DependentHomeScreen';
import GuardianHomeScreen from './src/screens/GuardianHomeScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch role from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Directional Logic based on Role
  return role === 'guardian' ? <GuardianHomeScreen /> : <DependentHomeScreen />;
}