import React, { useEffect } from 'react';
import './src/services/LocationTask'; // Important: Register task before UI
import { initDB } from './src/database/db';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  useEffect(() => {
    // Initialize SQLite Table
    initDB();
  }, []);

  return <HomeScreen />;
}