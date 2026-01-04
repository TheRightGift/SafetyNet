import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCSJmCRutv_aR8x8R99O3F9OQZ5U7FVk8k",
  authDomain: "safetynet-185dc.firebaseapp.com",
  projectId: "safetynet-185dc",
  storageBucket: "safetynet-185dc.firebasestorage.app",
  messagingSenderId: "644292868034",
  appId: "1:644292868034:web:7b808506f55426f55d085b",
  measurementId: "G-LV155PJF0X"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const seedUsers = async () => {
  try {
    // 1. Seed Guardian
    await setDoc(doc(db, "users", "guardian_123"), {
      uid: "guardian_123",
      email: "parent@test.com",
      role: "guardian",
      dependentId: "child_456"
    });

    // 2. Seed Dependent
    await setDoc(doc(db, "users", "child_456"), {
      uid: "child_456",
      email: "child@test.com",
      role: "dependent",
      guardianId: "guardian_123",
      lastPing: serverTimestamp(),
      status: "safe"
    });
    console.log("Database Seeded Successfully");
  } catch (e) {
    console.error("Seeding Error: ", e);
  }
};