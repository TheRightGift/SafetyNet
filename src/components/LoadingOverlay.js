import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Modal } from 'react-native';

export const LoadingOverlay = ({ visible, message = "Connecting..." }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  text: { marginTop: 15, color: '#111827', fontWeight: '600', fontSize: 16 }
});