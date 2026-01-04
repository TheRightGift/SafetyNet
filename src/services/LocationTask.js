import * as TaskManager from 'expo-task-manager';
import { uploadLocationBreadcrumb } from './SafetyService';
import { insertLocation } from '../database/db'; // Keep local backup

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_REPORT';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0].coords;
    
    // 1. Save to local SQLite (for offline redundancy)
    await insertLocation(latitude, longitude);

    // 2. Upload to Firebase (so Guardian can see it)
    await uploadLocationBreadcrumb(latitude, longitude);
  }
});