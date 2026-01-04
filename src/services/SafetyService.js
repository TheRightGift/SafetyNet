import { db } from '../database/firebase';
import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs 
} from "firebase/firestore";

/**
 * DEPENDENT LOGIC
 */

// 1. Update the status to 'safe' and refresh the timestamp
export const sendSafePing = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status: "safe",
      lastPing: serverTimestamp()
    });
    console.log("Ping successful for user:", userId);
  } catch (error) {
    console.error("Error in sendSafePing:", error);
    throw error;
  }
};

// 2. Upload a location coordinate to the cloud (called by Background Task)
export const uploadLocationBreadcrumb = async (lat, lon) => {
  try {
    const dependentId = "child_456"; // Use auth UID in production
    const logsRef = collection(db, "users", dependentId, "location_logs");
    await addDoc(logsRef, {
      latitude: lat,
      longitude: lon,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error uploading breadcrumb:", error);
  }
};

/**
 * GUARDIAN LOGIC
 */

// 3. Set the daily check-in deadline (format "HH:mm")
export const setDeadline = async (timeString) => {
  try {
    const userRef = doc(db, "users", "child_456");
    await updateDoc(userRef, { 
      checkInDeadline: timeString,
      status: "pending" // Reset to pending so the deadline can be tracked
    });
  } catch (error) {
    console.error("Error setting deadline:", error);
    throw error;
  }
};

// 4. Listen to the Dependent's document in real-time
export const subscribeToDependent = (dependentId, onUpdate) => {
  const docRef = doc(db, "users", dependentId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data());
    }
  }, (error) => {
    console.error("Subscription error:", error);
  });
};

// 5. Fetch all location logs for the dependent (used if they miss the deadline)
export const fetchMissedLogs = async () => {
  try {
    const logsRef = collection(db, "users", "child_456", "location_logs");
    const q = query(logsRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};