import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const SEGUROS = ['EsSalud', 'SIS', 'Seguro Privado / EPS'];

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seguro, setSeguro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFechaChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 5) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    } else if (cleaned.length >= 3) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    setFechaNacimiento(cleaned);
  };

  const handleRegister = async () => {
    // Validaciones
    if (!nombre || !apellido || !dni || !fechaNacimiento || !correo || !password || !confirmPassword || !seguro) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    if (dni.length !== 8 || isNaN(dni)) {
      Alert.alert('DNI inválido', 'El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    if (!correo.includes('@')) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password: password,
        options: {
          data: {
            full_name: `${nombre} ${apellido}`,
            dni: dni,
          }
        }
      });

      if (authError) {
        Alert.alert('Error de registro', authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'No se pudo crear el usuario. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // Convertir fecha de dd/mm/aaaa a aaaa-mm-dd
const convertirFecha = (fechaStr) => {
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`; // aaaa-mm-dd
  }
  return fechaStr;
};

const fechaFormateada = convertirFecha(fechaNacimiento);

const { error: insertError } = await supabase.from('pacientes').insert({
  nombre: nombre,
  apellido: apellido,
  dni: dni,
  email: correo,
  fecha_nacimiento: fechaFormateada,  // ← Usamos la fecha convertida
  tipo_seguro: seguro,
  user_id: authData.user.id,
});

      if (insertError) {
        console.log('Error al insertar:', insertError);
        Alert.alert('Error', `No se pudieron guardar tus datos: ${insertError.message}`);
      } else {
        Alert.alert(
          '¡Registro exitoso!', 
          'Tu cuenta ha sido creada. Ya puedes iniciar sesión.',
          [{ text: 'Ingresar', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.log('Error inesperado:', error);
      Alert.alert('Error inesperado', 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>✚</Text>
          </View>
          <Text style={styles.brandName}>Clínica Bienestar</Text>
          <Text style={styles.tagline}>Comienza tu camino hacia una salud más humana y cercana.</Text>
        </View>

        {/* Tarjeta de formulario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registro de Paciente</Text>

          {/* Nombre */}
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Juan"
            placeholderTextColor="#AAAAAA"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />

          {/* Apellido */}
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Pérez"
            placeholderTextColor="#AAAAAA"
            value={apellido}
            onChangeText={setApellido}
            autoCapitalize="words"
          />

          {/* DNI */}
          <Text style={styles.label}>DNI (8 dígitos)</Text>
          <TextInput
            style={styles.input}
            placeholder="00000000"
            placeholderTextColor="#AAAAAA"
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
            maxLength={8}
          />

          {/* Fecha de nacimiento */}
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/aaaa"
            placeholderTextColor="#AAAAAA"
            value={fechaNacimiento}
            onChangeText={handleFechaChange}
            keyboardType="numeric"
            maxLength={10}
          />

          {/* Correo electrónico */}
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@correo.com"
            placeholderTextColor="#AAAAAA"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#AAAAAA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Confirmar Contraseña */}
          <Text style={styles.label}>Confirmar Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#AAAAAA"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Tipo de Seguro */}
          <Text style={styles.label}>Tipo de Seguro</Text>
          {SEGUROS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.radioOption, seguro === item && styles.radioOptionSelected]}
              onPress={() => setSeguro(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, seguro === item && styles.radioCircleSelected]}>
                {seguro === item && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.radioLabel, seguro === item && styles.radioLabelSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Botón Registrarme */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Registrarme →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Link a Login */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Inicia sesión aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A6B5A',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 220,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  radioOptionSelected: {
    borderColor: '#1A6B5A',
    backgroundColor: '#F0FAF7',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#1A6B5A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A6B5A',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#1A6B5A',
    fontWeight: '600',
  },
  registerButton: {
    marginTop: 24,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#1A6B5A',
    fontWeight: '700',
  },
});