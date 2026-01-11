import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { registerUser, loginUser, resetPassword } from '../services/AuthService';
import { LoadingOverlay } from '../components/LoadingOverlay';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('dependent');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Required", "Please fill in all fields.");
    setLoading(true);
    try {
      if (isRegistering) {
        await registerUser(email, password, role);
      } else {
        await loginUser(email, password);
      }
    } catch (error) {
      Alert.alert("Auth Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LoadingOverlay visible={loading} message={isRegistering ? "Creating Account..." : "Signing In..."} />
      
      <View style={styles.inner}>
        <Text style={styles.title}>{isRegistering ? "Create Account" : "Welcome Back"}</Text>
        
        <Text style={styles.label}>Email Address</Text>
        <TextInput 
          placeholder="e.g. name@email.com" 
          style={[styles.input, focusedInput === 'email' && styles.inputFocused]} 
          value={email} 
          onChangeText={setEmail}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput 
          placeholder="••••••••" 
          style={[styles.input, focusedInput === 'pass' && styles.inputFocused]} 
          value={password} 
          onChangeText={setPassword}
          onFocus={() => setFocusedInput('pass')}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry 
        />

        {isRegistering && (
          <View style={styles.roleContainer}>
            <Text style={styles.label}>Identify as:</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity onPress={() => setRole('dependent')} style={[styles.roleBtn, role==='dependent' && styles.activeRole]}>
                <Text style={role==='dependent' ? styles.activeRoleText : styles.roleText}>Dependent</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRole('guardian')} style={[styles.roleBtn, role==='guardian' && styles.activeRole]}>
                <Text style={role==='guardian' ? styles.activeRoleText : styles.roleText}>Guardian</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} activeOpacity={0.8}>
          <Text style={styles.btnText}>{isRegistering ? "Register Account" : "Sign In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
          <Text style={styles.toggleText}>
            {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 2, 
    borderColor: '#D1D5DB', 
    padding: 16, 
    borderRadius: 14, 
    fontSize: 16, 
    color: '#111827', 
    marginBottom: 20 
  },
  inputFocused: { borderColor: '#10B981' },
  mainBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 20 },
  roleBtn: { padding: 14, borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 12, width: '48%', alignItems: 'center' },
  activeRole: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  roleText: { color: '#6B7280', fontWeight: '600' },
  activeRoleText: { color: '#065F46', fontWeight: 'bold' },
  toggleText: { textAlign: 'center', marginTop: 24, color: '#4B5563', fontWeight: '600' }
});