import { auth, db } from '../database/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

// --- Authentication Functions ---

export const registerUser = async (email, password, role) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: email,
    role: role, // 'guardian' or 'dependent'
    status: "pending",
    checkInDuration: null,
    linkedId: null // Stores the UID of the paired user
  });
  return user;
};

export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const resetPassword = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

export const logoutUser = () => signOut(auth);

// --- Pairing / Linking Logic ---

export const linkDependent = async (guardianId, pairingCode) => {
  const dependentRef = doc(db, "users", pairingCode);
  const dependentSnap = await getDoc(dependentRef);

  if (!dependentSnap.exists()) {
    throw new Error("Invalid Pairing Code. User not found.");
  }

  // Update Guardian with Dependent's ID
  await updateDoc(doc(db, "users", guardianId), {
    linkedId: pairingCode
  });

  // Update Dependent with Guardian's ID
  await updateDoc(dependentRef, {
    linkedId: guardianId
  });

  return dependentSnap.data();
};