import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function DestinationPicker({ visible, onClose, onConfirm }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker coordinate={selectedLocation} title="Selected Destination" />
          )}
        </MapView>

        <View style={styles.buttonOverlay}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.confirmBtn, !selectedLocation && styles.disabled]} 
            onPress={() => selectedLocation && onConfirm(selectedLocation)}
            disabled={!selectedLocation}
          >
            <Text style={styles.btnText}>Confirm Destination</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonOverlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20
  },
  confirmBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, flex: 1, marginLeft: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#6B7280', padding: 15, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  disabled: { backgroundColor: '#D1D5DB' }
});