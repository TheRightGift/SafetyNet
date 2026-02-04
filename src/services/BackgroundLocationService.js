import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { auth, db } from '../database/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { uploadLocationBreadcrumb, checkArrival } from './SafetyService';
import { requestFullLocationPermissions } from '../utils/PermissionHelper';

const TASK_NAME = 'safetynet-background-location';

// Define background task once
if (!TaskManager.isTaskDefined(TASK_NAME)) {
  TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn('Background location task error:', error);
      return;
    }
    const { locations } = data || {};
    const loc = locations?.[0];
    if (!loc) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const userData = snap.data();
      if (!userData) return;

      // Log breadcrumb
      await uploadLocationBreadcrumb(loc.coords.latitude, loc.coords.longitude, user.uid);

      // Check arrival state
      await checkArrival(loc.coords, { ...userData, uid: user.uid });
    } catch (e) {
      console.warn('Background task processing error:', e);
    }
  });
}

export const startBackgroundLocation = async () => {
  const hasPerm = await requestFullLocationPermissions();
  if (!hasPerm) return { started: false, reason: 'permissions' };

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (alreadyStarted) return { started: true };

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5 * 60 * 1000, // every 5 minutes
    distanceInterval: 50, // or when 50m moved
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'SafetyNet active',
      notificationBody: 'Sharing location for safety monitoring.',
    },
    showsBackgroundLocationIndicator: true,
  });
  return { started: true };
};

export const stopBackgroundLocation = async () => {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  return { stopped: true };
};
