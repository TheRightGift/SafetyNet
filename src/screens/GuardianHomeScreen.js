import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../database/firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { linkDependent, logoutUser } from '../services/AuthService';
import { setCheckInDuration, fetchMissedLogs } from '../services/SafetyService';
import { registerForPushNotifications } from '../services/NotificationService';
import HistoryMap from '../components/HistoryMap';
import { LoadingOverlay } from '../components/LoadingOverlay';

export default function GuardianHomeScreen() {
  const [pairingCode, setPairingCode] = useState('');
  const [linkedId, setLinkedId] = useState(null);
  const [dependentData, setDependentData] = useState(null);
  const [missedLogs, setMissedLogs] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const guardianId = auth.currentUser.uid;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", guardianId), (docSnap) => {
      if (docSnap.exists()) setLinkedId(docSnap.data().linkedId);
    });
    // Register push token for guardian alerts
    registerForPushNotifications(guardianId).catch((err) => console.warn('Push registration failed', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!linkedId) return;
    const unsub = onSnapshot(doc(db, "users", linkedId), async (docSnap) => {
      try {
        const data = docSnap.data();
        setDependentData(data);
        if (data?.status === 'sos' || (data?.nextCheckInDeadline && Date.now() > data.nextCheckInDeadline && data.status !== 'safe')) {
          const logs = await fetchMissedLogs(linkedId);
          setMissedLogs(logs);
        }
      } catch (e) {
        console.warn('Dependent listener error', e);
      }
    });
    return () => unsub();
  }, [linkedId]);

  const handleLink = async () => {
    setIsActionLoading(true);
    try {
      await linkDependent(guardianId, pairingCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Account Linked Successfully");
    } catch (e) {
      Alert.alert("Link Failed", e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!linkedId) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={isActionLoading} message="Linking Account..." />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.title}>No Dependent Linked</Text>
          <Text style={styles.subText}>Enter the code from the Dependent's screen to start monitoring.</Text>
          <TextInput 
            style={styles.linkInput} 
            placeholder="Paste Code Here" 
            value={pairingCode}
            onChangeText={setPairingCode}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLink}>
            <Text style={styles.btnText}>Connect Now</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guardian Monitor</Text>
        <TouchableOpacity onPress={logoutUser}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* ... Frequency Grid & Map Trail Components ... */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 32, alignItems: 'center' },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subText: { textAlign: 'center', color: '#6B7280', marginVertical: 16, fontSize: 16, lineHeight: 24 },
  linkInput: { width: '100%', backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D1D5DB', padding: 18, borderRadius: 16, fontSize: 14, marginBottom: 20 },
  primaryBtn: { backgroundColor: '#3B82F6', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  logoutText: { color: '#EF4444', fontWeight: 'bold' },
  logoutBtn: { marginTop: 30 }
});