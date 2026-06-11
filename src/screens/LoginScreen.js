import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!dni || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }
    if (dni.length !== 8 || isNaN(dni)) {
      Alert.alert('Error', 'El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    setLoading(true);
    try {
      // Buscar el email asociado al DNI en la tabla de pacientes
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('email')
        .eq('dni', dni)
        .single();

      if (patientError || !patientData) {
        Alert.alert('Error', 'DNI no encontrado. Verifica tus datos.');
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: patientData.email,
        password: password,
      });

      if (signInError) {
        Alert.alert('Error', 'Contraseña incorrecta. Inténtalo de nuevo.');
      } else {
        // Login exitoso - navegar al Home
        navigation.replace('Home');
      }
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo e ícono */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>✚</Text>
          </View>
          <Text style={styles.brandName}>Clínica Bienestar</Text>
          <Text style={styles.tagline}>Salud humanizada para tu tranquilidad</Text>
        </View>

        {/* Tarjeta de login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          {/* Campo DNI */}
          <Text style={styles.label}>DNI (8 dígitos)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🪪</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su DNI"
              placeholderTextColor="#AAAAAA"
              value={dni}
              onChangeText={setDni}
              keyboardType="numeric"
              maxLength={8}
            />
          </View>

          {/* Campo Contraseña */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Contraseña</Text>
            <TouchableOpacity onPress={() => Alert.alert('Recuperar', 'Funcionalidad próximamente.')}>
              <Text style={styles.forgotText}>¿Olvidé mi contraseña?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Botón Ingresar */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Registro */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>¿No tengo una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1A6B5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1A6B5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A6B5A',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    color: '#1A6B5A',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  eyeIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  loginButton: {
    marginTop: 28,
    backgroundColor: '#1A6B5A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1A6B5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#1A6B5A',
    fontWeight: '700',
  },
});