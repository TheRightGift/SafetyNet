import * as TaskManager from 'expo-task-manager';
import { insertLocation } from '../database/db';

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_REPORT';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background Task Error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0].coords;
    
    // Save to phone memory via SQLite
    await insertLocation(latitude, longitude);
  }
});