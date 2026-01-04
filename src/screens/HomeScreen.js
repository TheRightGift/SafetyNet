import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { db } from '../database/firebase';
import { doc, onSnapshot } from "firebase/firestore";
// Import the functions with curly braces to avoid "undefined" errors
import { 
  setDeadline, 
  fetchMissedLogs, 
  sendSafePing 
} from '../services/SafetyService';

export default function HomeScreen() {
  const [role, setRole] = useState('dependent'); // Mock role state
  const [dependentData, setDependentData] = useState(null);
  const [missedLogs, setMissedLogs] = useState([]);
  const [isOverdue, setIsOverdue] = useState(false);
  const [loading, setLoading] = useState(true);

  const DEPENDENT_ID = "child_456"; // Using the seeded ID

  useEffect(() => {
    // Real-time listener for the Dependent's document
    const unsub = onSnapshot(doc(db, "users", DEPENDENT_ID), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDependentData(data);
        checkDeadline(data);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const checkDeadline = async (data) => {
    if (!data?.checkInDeadline || data.status === 'safe') {
      setIsOverdue(false);
      return;
    }

    // Logic to compare current time with the "HH:mm" string
    const [hrs, mins] = data.checkInDeadline.split(':');
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(parseInt(hrs), parseInt(mins), 0);

    if (now > deadline) {
      setIsOverdue(true);
      const logs = await fetchMissedLogs();
      setMissedLogs(logs);
    } else {
      setIsOverdue(false);
    }
  };

  const handlePingPress = async () => {
    try {
      await sendSafePing(DEPENDENT_ID);
      Alert.alert("Status Updated", "Guardian has been notified that you are safe.");
    } catch (err) {
      Alert.alert("Ping Failed", err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Role Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, role === 'dependent' && styles.activeTab]} 
          onPress={() => setRole('dependent')}
        >
          <Text style={role === 'dependent' ? styles.activeTabText : styles.tabText}>Dependent</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, role === 'guardian' && styles.activeTab]} 
          onPress={() => setRole('guardian')}
        >
          <Text style={role === 'guardian' ? styles.activeTabText : styles.tabText}>Guardian</Text>
        </TouchableOpacity>
      </View>

      {role === 'dependent' ? (
        <View style={styles.viewContent}>
          <Text style={styles.header}>Safety Status</Text>
          <Text style={styles.subHeader}>Deadline: {dependentData?.checkInDeadline || "Not Set"}</Text>
          
          <TouchableOpacity 
            style={[styles.pingBtn, { backgroundColor: dependentData?.status === 'safe' ? '#4CAF50' : '#FF9800' }]} 
            onPress={handlePingPress}
          >
            <Text style={styles.pingBtnText}>
              {dependentData?.status === 'safe' ? 'I AM SAFE' : 'SEND PING'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.statusInfo}>
            Status: {dependentData?.status?.toUpperCase()}
          </Text>
        </View>
      ) : (
        <View style={styles.viewContent}>
          <Text style={styles.header}>Guardian Monitor</Text>
          
          <View style={styles.deadlineActions}>
            <TouchableOpacity style={styles.smallBtn} onPress={() => setDeadline("18:00")}>
              <Text>Set 6:00 PM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallBtn} onPress={() => setDeadline("21:00")}>
              <Text>Set 9:00 PM</Text>
            </TouchableOpacity>
          </View>

          {isOverdue ? (
            <View style={styles.alertArea}>
              <Text style={styles.errorText}>⚠️ CHECK-IN MISSED</Text>
              <Text style={styles.alertSubText}>Showing path history:</Text>
              <FlatList
                data={missedLogs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.logItem}>
                    <Text style={styles.logCoords}>📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</Text>
                    <Text style={styles.logTime}>{item.timestamp?.toDate().toLocaleTimeString()}</Text>
                  </View>
                )}
              />
            </View>
          ) : (
            <View style={styles.safeCard}>
              <Text style={styles.safeText}>
                {dependentData?.status === 'safe' ? '✅ Dependent is Safe' : '⏳ Waiting for check-in...'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: 50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ddd' },
  activeTab: { borderBottomColor: '#4CAF50' },
  tabText: { color: '#888', fontWeight: '600' },
  activeTabText: { color: '#4CAF50', fontWeight: 'bold' },
  viewContent: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subHeader: { fontSize: 16, color: '#666', marginBottom: 30 },
  pingBtn: { 
    width: 220, height: 220, borderRadius: 110, 
    justifyContent: 'center', alignItems: 'center', 
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3 
  },
  pingBtnText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  statusInfo: { marginTop: 20, fontSize: 18, color: '#444' },
  deadlineActions: { flexDirection: 'row', gap: 10, marginVertical: 20 },
  smallBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  alertArea: { width: '100%', flex: 1, backgroundColor: '#FFEBEE', borderRadius: 15, padding: 15, marginTop: 10 },
  errorText: { color: '#D32F2F', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  alertSubText: { textAlign: 'center', color: '#666', marginBottom: 10 },
  safeCard: { padding: 30, backgroundColor: '#E8F5E9', borderRadius: 15, width: '100%', alignItems: 'center' },
  safeText: { fontSize: 18, color: '#2E7D32', fontWeight: '600' },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FFCDD2' },
  logCoords: { fontSize: 14, color: '#333' },
  logTime: { fontSize: 12, color: '#888' }
});