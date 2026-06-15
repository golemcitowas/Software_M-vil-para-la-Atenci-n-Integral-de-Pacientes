import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function RecetasScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>Recetas Médicas</Text>
        <Text style={styles.subtitle}>Próximamente podrás ver tus recetas aquí</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A2C3E', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7A8A', marginBottom: 30, textAlign: 'center' },
  button: { backgroundColor: '#1A6B5A', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});