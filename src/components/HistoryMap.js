import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function HistoryMap({ logs }) {
  if (!logs || logs.length === 0) return null;

  // Format logs for the Polyline component
  const path = logs.map(log => ({
    latitude: log.latitude,
    longitude: log.longitude,
  })).reverse(); // Reverse so the line draws in chronological order

  const lastPosition = path[path.length - 1];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: lastPosition.latitude,
          longitude: lastPosition.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Draw the Path */}
        <Polyline
          coordinates={path}
          strokeColor="#DC2626" // Red line for danger/overdue
          strokeWidth={4}
        />

        {/* Mark the last known location */}
        <Marker 
          coordinate={lastPosition} 
          title="Last Seen" 
          pinColor="red"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
});