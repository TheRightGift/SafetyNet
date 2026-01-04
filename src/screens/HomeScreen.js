import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { seedUsers } from '../database/firebase';
import { sendSafePing, subscribeToDependent } from '../services/SafetyService';

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState(null); // 'guardian' or 'dependent'
  const [dependentData, setDependentData] = useState(null);

  // 1. Seed data on first launch
  useEffect(() => {
    seedUsers();
  }, []);

  // 2. If in Guardian mode, listen to the child's status
  useEffect(() => {
    let unsubscribe;
    if (viewMode === 'guardian') {
      unsubscribe = subscribeToDependent("child_456", (data) => {
        setDependentData(data);
      });
    }
    return () => unsubscribe && unsubscribe();
  }, [viewMode]);

  const handlePing = async () => {
    try {
      await sendSafePing("child_456");
      Alert.alert("Success", "Safe signal sent to Guardian!");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (!viewMode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to SafetyNet</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setViewMode('dependent')}>
          <Text style={styles.btnText}>I am the Dependent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, {backgroundColor: '#2196F3'}]} onPress={() => setViewMode('guardian')}>
          <Text style={styles.btnText}>I am the Guardian</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setViewMode(null)}>
        <Text style={styles.backBtn}>← Switch Role</Text>
      </TouchableOpacity>

      {viewMode === 'dependent' ? (
        <View style={styles.center}>
          <Text style={styles.roleTitle}>Dependent Mode</Text>
          <TouchableOpacity style={styles.pingCircle} onPress={handlePing}>
            <Text style={styles.pingText}>I AM SAFE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.roleTitle}>Guardian Monitor</Text>
          <View style={styles.statusCard}>
            <Text>Monitoring: child@test.com</Text>
            <Text style={styles.statusText}>
              Status: {dependentData?.status === 'safe' ? '✅ SAFE' : '⚠️ UNKNOWN'}
            </Text>
            <Text style={styles.subText}>
              Last Ping: {dependentData?.lastPing?.toDate().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  roleTitle: { fontSize: 20, marginBottom: 20, fontWeight: '600' },
  btn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, marginVertical: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  backBtn: { color: '#666', marginBottom: 20 },
  center: { alignItems: 'center' },
  pingCircle: { 
    width: 200, height: 200, borderRadius: 100, backgroundColor: '#4CAF50', 
    justifyContent: 'center', alignItems: 'center', elevation: 10 
  },
  pingText: { color: '#white', fontSize: 24, fontWeight: 'bold' },
  statusCard: { 
    width: '100%', padding: 20, borderRadius: 15, backgroundColor: '#f9f9f9',
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center'
  },
  statusText: { fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  subText: { color: '#888', fontSize: 12 }
});