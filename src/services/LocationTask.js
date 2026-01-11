import * as TaskManager from 'expo-task-manager';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../database/firebase';
import { uploadLocationBreadcrumb, checkArrival } from './SafetyService';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background Location Error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    const userId = auth.currentUser?.uid;

    if (userId && location) {
      try {
        // 1. Fetch latest user data (to see if they have a destination set)
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // 2. Check if the user has arrived at their destination
          await checkArrival(location.coords, { ...userData, uid: userId });

          // 3. Upload the current point to the breadcrumb history
          await uploadLocationBreadcrumb(
            location.coords.latitude, 
            location.coords.longitude, 
            userId
          );
        }
      } catch (e) {
        console.error("Task Logic Error:", e);
      }
    }
  }
});