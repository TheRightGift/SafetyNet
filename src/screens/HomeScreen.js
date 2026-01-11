import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  ActivityIndicator, SafeAreaView, ScrollView 
} from 'react-native';
import * as Location from 'expo-location';
import { db } from '../database/firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { auth } from '../database/firebase';
import { 
  setCheckInDuration, 
  sendSafePing, 
  fetchMissedLogs 
} from '../services/SafetyService';
import { requestFullLocationPermissions } from '../utils/PermissionHelper';
import { LOCATION_TASK_NAME } from '../services/LocationTask';
import HistoryMap from '../components/HistoryMap';

export default function HomeScreen() {
  const [role, setRole] = useState('dependent'); 
  const [hasPermissions, setHasPermissions] = useState(false);
  const [dependentData, setDependentData] = useState(null);
  const [missedLogs, setMissedLogs] = useState([]);
  const [isOverdue, setIsOverdue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('--:--:--');

  const DEPENDENT_ID = "child_456";

  useEffect(() => {
    checkInitialPermissions();
    
    const unsub = onSnapshot(doc(db, "users", DEPENDENT_ID), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDependentData(data);
        handleStatusLogic(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dependentData?.nextCheckInDeadline) {
        const now = Date.now();
        const diff = dependentData.nextCheckInDeadline - now;
        if (diff <= 0) {
          setTimeLeft("OVERDUE");
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dependentData?.nextCheckInDeadline]);

  const checkInitialPermissions = async () => {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status === 'granted') {
      setHasPermissions(true);
      startTracking();
    } else {
      setLoading(false);
    }
  };

  const handleEnablePermissions = async () => {
    const granted = await requestFullLocationPermissions();
    if (granted) {
      setHasPermissions(true);
      startTracking();
    }
  };

  const startTracking = async () => {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!started) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 60000,
        foregroundService: { notificationTitle: "SafetyNet", notificationBody: "Tracking Active" }
      });
    }
  };

  const handleStatusLogic = async (data) => {
    if (Date.now() > data.nextCheckInDeadline && data.status !== 'safe') {
      setIsOverdue(true);
      const logs = await fetchMissedLogs();
      setMissedLogs(logs);
    } else {
      setIsOverdue(false);
    }
  };

  // REUSABLE UI: Duration Selector
  const DurationSelector = ({ title }) => (
  <View style={styles.selectorCard}>
    <Text style={styles.selectorTitle}>{title}</Text>
    <View style={styles.grid}>
      {[1, 2, 6, 12].map(hr => (
        <TouchableOpacity 
          key={hr} 
          style={styles.gridBtn} 
          // Pass BOTH the hours and the DEPENDENT_ID here
          onPress={() => setCheckInDuration(hr, DEPENDENT_ID)} 
        >
          <Text style={styles.gridBtnText}>{hr}hr</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" />;

  if (!hasPermissions) {
    return (
      <View style={styles.centered}>
        <Text style={styles.header}>Permissions Required</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleEnablePermissions}>
          <Text style={styles.btnText}>Enable Always Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setRole('dependent')} style={[styles.tab, role==='dependent' && styles.activeTab]}>
          <Text>Dependent</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('guardian')} style={[styles.tab, role==='guardian' && styles.activeTab]}>
          <Text>Guardian</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {role === 'dependent' ? (
          <View style={styles.viewBody}>
            {!dependentData?.checkInDuration ? (
              <DurationSelector title="Set your safety interval to begin" />
            ) : (
              <>
                <Text style={styles.label}>Next Check-in In:</Text>
                <Text style={[styles.timer, timeLeft === 'OVERDUE' && {color: 'red'}]}>{timeLeft}</Text>
                <TouchableOpacity style={styles.pingBtn} onPress={() => sendSafePing(DEPENDENT_ID)}>
                  <Text style={styles.pingText}>I AM SAFE</Text>
                </TouchableOpacity>
                <Text style={styles.footerInfo}>Frequency: every {dependentData.checkInDuration}h</Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.viewBody}>
            <DurationSelector title="Change Tracking Interval" />
            {isOverdue ? (
              <View style={styles.alertBox}>
                <Text style={styles.alertHeader}>⚠️ MISSED CHECK-IN</Text>
                <HistoryMap logs={missedLogs} />
              </View>
            ) : (
              <View style={styles.safeCard}>
                <Text style={styles.safeText}>
                  Status: {dependentData?.status === 'safe' ? "✅ Safe" : "⏳ Monitoring"}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#10B981' },
  scrollContent: { padding: 20 },
  viewBody: { alignItems: 'center' },
  selectorCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, width: '100%', elevation: 3, marginBottom: 20 },
  selectorTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  grid: { flexDirection: 'row', justifyContent: 'space-around' },
  gridBtn: { backgroundColor: '#10B981', padding: 12, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  gridBtnText: { color: '#FFF', fontWeight: 'bold' },
  timer: { fontSize: 48, fontWeight: 'bold', color: '#10B981', marginVertical: 30 },
  pingBtn: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  pingText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  alertBox: { width: '100%', marginTop: 20 },
  alertHeader: { color: '#DC2626', fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 10 },
  safeCard: { backgroundColor: '#E1F5FE', padding: 30, borderRadius: 15, width: '100%', alignItems: 'center', marginTop: 20 },
  safeText: { fontSize: 18, fontWeight: 'bold', color: '#0288D1' },
  primaryBtn: { backgroundColor: '#2563EB', padding: 15, borderRadius: 10, width: '80%' },
  btnText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: '#666', fontSize: 16 }
});