import { db } from '../database/firebase';
import { 
  doc, updateDoc, collection, addDoc, 
  serverTimestamp, query, orderBy, getDocs, getDoc 
} from "firebase/firestore";
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { sendPushNotification } from './NotificationService';

/**
 * Sets a destination and resets the arrived status.
 */
export const setDestination = async (userId, coords, name) => {
  try {
    const userRef = doc(db, "users", userId);

    // Allow clearing destination by passing null
    if (!coords) {
      await updateDoc(userRef, { destination: null });
      return;
    }

    await updateDoc(userRef, {
      destination: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: name,
        arrived: false
      }
    });
  } catch (error) {
    console.error("Error setting destination:", error);
  }
};

/**
 * Checks if current location is within 200m of destination.
 * Triggered by the background task.
 */
export const checkArrival = async (currentCoords, userData) => {
  if (!userData?.destination || userData.destination.arrived) return;

  const distance = getDistance(
    { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
    { latitude: userData.destination.latitude, longitude: userData.destination.longitude }
  );

  if (distance < 200) { 
    const userRef = doc(db, "users", userData.uid);
    await updateDoc(userRef, { "destination.arrived": true });

    if (userData.linkedId) {
      const guardianSnap = await getDoc(doc(db, "users", userData.linkedId));
      const token = guardianSnap.data()?.pushToken;
      if (token) {
        await sendPushNotification(token, "✅ Arrival Confirmed", `${userData.email} has arrived at ${userData.destination.name}`);
      }
    }
  }
};

export const triggerPanicMode = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await updateDoc(userRef, { status: "sos", panicTimestamp: serverTimestamp() });
    await uploadLocationBreadcrumb(location.coords.latitude, location.coords.longitude, userId);

    if (userData.linkedId) {
      const gSnap = await getDoc(doc(db, "users", userData.linkedId));
      const token = gSnap.data()?.pushToken;
      if (token) await sendPushNotification(token, "🚨 SOS ALERT", "Dependent triggered Panic Button!");
    }
  } catch (error) {
    console.error("Error in triggerPanicMode:", error);
  }
};

export const sendSafePing = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();

  const hours = Number(data?.checkInDuration);
  const durationHours = Number.isFinite(hours) && hours > 0 ? hours : 1;
  const nextDeadline = Date.now() + durationHours * 3600000;

  await updateDoc(userRef, { status: "safe", nextCheckInDeadline: nextDeadline });
};

export const uploadLocationBreadcrumb = async (lat, lon, userId) => {
  const logsRef = collection(db, "users", userId, "location_logs");
  await addDoc(logsRef, { latitude: lat, longitude: lon, timestamp: serverTimestamp() });
};

export const fetchMissedLogs = async (userId) => {
  const logsRef = collection(db, "users", userId, "location_logs");
  const q = query(logsRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};