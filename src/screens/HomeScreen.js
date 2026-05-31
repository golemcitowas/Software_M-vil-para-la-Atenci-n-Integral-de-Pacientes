import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Bienvenido</Text>
      <Text style={styles.subtitle}>Sistema de Atención Integral de Pacientes</Text>
      
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuButton}><Text style={styles.menuButtonText}>📋 Lista de Pacientes</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}><Text style={styles.menuButtonText}>➕ Registrar Paciente</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}><Text style={styles.menuButtonText}>📅 Citas Médicas</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}><Text style={styles.menuButtonText}>📊 Reportes</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', textAlign: 'center', marginTop: 50, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  menuContainer: { flex: 1, justifyContent: 'center' },
  menuButton: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 15, elevation: 2 },
  menuButtonText: { fontSize: 18, color: '#333', textAlign: 'center' },
  logoutButton: { backgroundColor: '#ff4444', padding: 15, borderRadius: 10, marginBottom: 20 },
  logoutText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
});
