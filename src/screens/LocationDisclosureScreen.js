import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import * as Location from 'expo-location';

export default function LocationDisclosureScreen({ onAccept }) {
  const requestPermissions = async () => {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground === 'granted') {
      const { status: background } = await Location.requestBackgroundPermissionsAsync();
      if (background === 'granted') {
        onAccept();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Location Privacy Disclosure</Text>
        <Text style={styles.description}>
          SafetyNet collects location data to enable:
        </Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Real-time location sharing with your linked Guardian during an SOS.</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Automated "Safe Arrival" notifications when you reach your destination.</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Historical breadcrumbs if a safety check-in is missed.</Text>
        </View>
        <Text style={styles.footerNote}>
          This data is collected even when the app is closed or not in use to ensure your safety.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={requestPermissions}>
          <Text style={styles.btnText}>I Understand & Accept</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  description: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 15, alignSelf: 'flex-start' },
  bulletPoint: { flexDirection: 'row', marginBottom: 10, paddingRight: 20 },
  bullet: { marginRight: 10, fontSize: 18, color: '#10B981' },
  bulletText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  footerNote: { fontSize: 12, color: '#9CA3AF', marginTop: 30, textAlign: 'center', fontStyle: 'italic' },
  btn: { backgroundColor: '#10B981', padding: 18, borderRadius: 12, width: '100%', marginTop: 40, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});