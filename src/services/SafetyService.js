import { db } from '../database/firebase';
import { doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

// Logic for Dependent Side
export const sendSafePing = async (userId) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    status: "safe",
    lastPing: serverTimestamp()
  });
};

// Logic for Guardian Side (Listener)
export const subscribeToDependent = (dependentId, onUpdate) => {
  const docRef = doc(db, "users", dependentId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data());
    }
  });
};