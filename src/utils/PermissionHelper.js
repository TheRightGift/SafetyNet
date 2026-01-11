import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export const requestFullLocationPermissions = async () => {
  // 1. Request Foreground Permission
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    Alert.alert(
      "Permission Required",
      "This app needs foreground location to function. Please enable it in settings.",
      [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
    );
    return false;
  }

  // 2. Request Background Permission (This triggers the "Allow all the time" prompt)
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    Alert.alert(
      "Action Required: 'Allow All The Time'",
      "To protect you even when the app is closed, please set location permission to 'Allow all the time' in your system settings.",
      [{ text: "Go to Settings", onPress: () => Linking.openSettings() }]
    );
    return false;
  }

  return true;
};