import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  Pressable, 
  Animated,
  ScrollView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../database/firebase';
import { doc, onSnapshot } from "firebase/firestore";

// Service & Component Imports
import { sendSafePing, triggerPanicMode, setDestination } from '../services/SafetyService';
import { logoutUser } from '../services/AuthService';
import DestinationPicker from '../components/DestinationPicker';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { startBackgroundLocation, stopBackgroundLocation } from '../services/BackgroundLocationService';

export default function DependentHomeScreen() {
  const [userData, setUserData] = useState(null);
  const [timeLeft, setTimeLeft] = useState('--:--:--');
  const [isHolding, setIsHolding] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [bgStatus, setBgStatus] = useState('starting'); // starting | on | off | denied
  
  const userId = auth.currentUser.uid;
  const holdAnim = useRef(new Animated.Value(0)).current;

  // 1. Real-time Data Listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

    // Start background location for dependent
    startBackgroundLocation()
      .then((res) => setBgStatus(res?.started ? 'on' : res?.reason === 'permissions' ? 'denied' : 'off'))
      .catch((err) => {
        console.warn('Background location start failed', err);
        setBgStatus('off');
      });

    return () => {
      unsub();
      stopBackgroundLocation().catch(() => {});
    };
  }, []);

  // 2. Countdown Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (userData?.nextCheckInDeadline) {
        const diff = userData.nextCheckInDeadline - Date.now();
        if (diff <= 0) {
          setTimeLeft("OVERDUE");
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [userData]);

  // --- Handlers ---

  const handlePing = async () => {
    setIsActionLoading(true);
    try {
      await sendSafePing(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Check-in failed. Please check your connection.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const startHold = () => {
    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.timing(holdAnim, {
      toValue: 1,
      duration: 2000, 
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerPanicMode(userId).catch((err) => Alert.alert('SOS Error', err?.message || 'Unable to trigger SOS'));
        // Retry background start if previously denied
        if (bgStatus === 'denied' || bgStatus === 'off') {
          startBackgroundLocation()
            .then((res) => setBgStatus(res?.started ? 'on' : res?.reason === 'permissions' ? 'denied' : 'off'))
            .catch(() => setBgStatus('off'));
        }
      }
    });
  };

  const cancelHold = () => {
    setIsHolding(false);
    Animated.timing(holdAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const handleConfirmDestination = async (coords) => {
    setIsActionLoading(true);
    await setDestination(userId, coords, "Target Location");
    setPickerVisible(false);
    setIsActionLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Interpolations
  const progressWidth = holdAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const panicBgColor = holdAnim.interpolate({ inputRange: [0, 1], outputRange: ['#7F1D1D', '#DC2626'] });

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={isActionLoading} />
      <DestinationPicker 
        visible={pickerVisible} 
        onClose={() => setPickerVisible(false)} 
        onConfirm={handleConfirmDestination} 
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>DEPENDENT ACTIVE</Text>
          <Text style={styles.headerEmail}>{userData?.email}</Text>
        </View>
        <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Background status indicator */}
        <View style={styles.bgStatusRow}>
          <View style={[styles.statusDot, bgStatus === 'on' ? styles.dotOn : bgStatus === 'denied' ? styles.dotDenied : styles.dotOff]} />
          <Text style={styles.bgStatusText}>
            {bgStatus === 'on' && 'Background location active'}
            {bgStatus === 'denied' && 'Location permission denied - tap SOS to retry prompt'}
            {bgStatus === 'off' && 'Background location inactive'}
            {bgStatus === 'starting' && 'Starting background location...'}
          </Text>
        </View>

        {/* Pairing Code - Accessible and High Contrast */}
        <View style={styles.pairingCard}>
          <Text style={styles.cardTitle}>Your Pairing Code</Text>
          <Text selectable style={styles.codeText}>{userId}</Text>
          <Text style={styles.cardSub}>Guardian needs this to link accounts</Text>
        </View>

        {/* Safe Arrival Tracking */}
        {userData?.destination && !userData.destination.arrived ? (
          <View style={styles.arrivalActiveCard}>
            <Text style={styles.arrivalTitle}>📍 Tracking Arrival</Text>
            <Text style={styles.arrivalSub}>Destination: {userData.destination.name}</Text>
            <TouchableOpacity onPress={() => setDestination(userId, null, null)}>
              <Text style={styles.cancelTrip}>End Tracking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.arrivalBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.arrivalBtnText}>+ Set Safe Arrival Point</Text>
          </TouchableOpacity>
        )}

        {/* Countdown Timer */}
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>NEXT SAFETY CHECK</Text>
          <Text style={[styles.timerValue, timeLeft === 'OVERDUE' && styles.overdueText]}>
            {timeLeft}
          </Text>
        </View>

        {/* Main Check-in Button */}
        <TouchableOpacity style={styles.pingBtn} onPress={handlePing} activeOpacity={0.8}>
          <Text style={styles.pingBtnText}>I AM SAFE</Text>
        </TouchableOpacity>

        {/* SOS Long Press Section */}
        <View style={styles.panicContainer}>
          <Text style={styles.panicHint}>
            {isHolding ? "HOLDING..." : "HOLD FOR SOS (2S)"}
          </Text>
          <Pressable onPressIn={startHold} onPressOut={cancelHold} style={styles.panicPressable}>
            <Animated.View style={[styles.panicBtn, { backgroundColor: panicBgColor }]}>
              <Text style={styles.panicText}>EMERGENCY PANIC</Text>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1.5, 
    borderBottomColor: '#E5E7EB' 
  },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
  headerEmail: { fontSize: 14, color: '#111827', fontWeight: '500' },
  logoutText: { color: '#EF4444', fontWeight: 'bold' },
  scrollBody: { alignItems: 'center', padding: 20 },
  pairingCard: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 14, 
    width: '100%', 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    borderColor: '#D1D5DB', 
    alignItems: 'center',
    marginBottom: 20
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  codeText: { fontSize: 11, fontWeight: '800', color: '#111827', marginVertical: 6 },
  cardSub: { fontSize: 10, color: '#9CA3AF' },
  arrivalBtn: { 
    backgroundColor: '#EFF6FF', 
    width: '100%', 
    padding: 16, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: '#BFDBFE', 
    alignItems: 'center',
    marginBottom: 20
  },
  arrivalBtnText: { color: '#1E40AF', fontWeight: '700' },
  arrivalActiveCard: { backgroundColor: '#1E40AF', width: '100%', padding: 16, borderRadius: 14, marginBottom: 20 },
  arrivalTitle: { color: '#FFF', fontWeight: '800', textAlign: 'center' },
  arrivalSub: { color: '#DBEAFE', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cancelTrip: { color: '#FFF', fontSize: 11, textDecorationLine: 'underline', textAlign: 'center', marginTop: 8 },
  timerBox: { alignItems: 'center', marginVertical: 24 },
  timerLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  timerValue: { fontSize: 64, fontWeight: '900', color: '#111827' },
  overdueText: { color: '#DC2626' },
  pingBtn: { 
    width: 240, 
    height: 240, 
    borderRadius: 120, 
    backgroundColor: '#10B981', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    marginBottom: 40
  },
  pingBtnText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  panicContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  panicHint: { fontSize: 12, fontWeight: '800', color: '#7F1D1D', marginBottom: 12 },
  panicPressable: { width: '100%', height: 75 },
  panicBtn: { flex: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  panicText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 2 },
  progressTrack: { position: 'absolute', bottom: 0, left: 0, height: 8, width: '100%', backgroundColor: 'rgba(0,0,0,0.15)' },
  progressFill: { height: '100%', backgroundColor: '#FFF' }
});