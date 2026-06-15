import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function PerfilScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paciente, setPaciente] = useState(null);
  
  // Campos editables
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  
  // Nuevas contraseñas
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'No se encontró usuario');
        navigation.replace('Login');
        return;
      }

      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setPaciente(data);
      setNombre(data.nombre || '');
      setApellido(data.apellido || '');
      setDni(data.dni || '');
      setEmail(data.email || '');
      setFechaNacimiento(data.fecha_nacimiento || '');
      setTipoSeguro(data.tipo_seguro || '');
      
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarPerfil = async () => {
    if (!nombre || !apellido || !email) {
      Alert.alert('Error', 'Nombre, apellido y email son obligatorios');
      return;
    }

    if (email.includes('@') === false) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Actualizar datos del paciente
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({
          nombre: nombre,
          apellido: apellido,
          dni: dni,
          email: email,
          fecha_nacimiento: fechaNacimiento,
          tipo_seguro: tipoSeguro,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Si el email cambió, actualizar también en Auth
      if (email !== paciente?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email,
        });
        if (authError) console.log('Error actualizando email en Auth:', authError);
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Alert.alert('Error', 'No se pudo guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarContrasena = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Completa todos los campos de contraseña');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Contraseña actual incorrecta');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
      
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      Alert.alert('Error', 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const formatFechaDisplay = (fecha) => {
    if (!fecha) return '';
    if (fecha.includes('-')) {
      const partes = fecha.split('-');
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fecha;
  };

  const formatFechaParaBD = (fecha) => {
    if (!fecha) return '';
    const partes = fecha.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fecha;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A6B5A" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{nombre} {apellido}</Text>
          <Text style={styles.userRole}>Paciente</Text>
        </View>

        {/* Datos Personales */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Datos Personales</Text>

          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Apellido *</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu apellido"
            value={apellido}
            onChangeText={setApellido}
          />

          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="DNI"
            value={dni}
            editable={false}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Fecha de Nacimiento</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/aaaa"
            value={formatFechaDisplay(fechaNacimiento)}
            onChangeText={(text) => setFechaNacimiento(formatFechaParaBD(text))}
            keyboardType="numeric"
            maxLength={10}
          />

          <Text style={styles.label}>Tipo de Seguro</Text>
          <View style={styles.seguroContainer}>
            {['EsSalud', 'SIS', 'Seguro Privado / EPS'].map((seg) => (
              <TouchableOpacity
                key={seg}
                style={[styles.seguroOption, tipoSeguro === seg && styles.seguroOptionSelected]}
                onPress={() => setTipoSeguro(seg)}
              >
                <Text style={[styles.seguroText, tipoSeguro === seg && styles.seguroTextSelected]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleGuardarPerfil}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sección de Contraseña */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text style={styles.cardTitle}>🔒 Cambiar Contraseña</Text>
            <Text style={styles.chevron}>{showPasswordSection ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <View>
              <Text style={styles.label}>Contraseña Actual</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu nueva contraseña"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.changePasswordButton, saving && styles.buttonDisabled]}
                onPress={handleCambiarContrasena}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>Actualizar Contraseña</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.versionText}>Versión 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A6B5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2C3E',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7A8A',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2C3E',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 16,
    color: '#6B7A8A',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  seguroContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  seguroOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  seguroOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#1A6B5A',
  },
  seguroText: {
    fontSize: 13,
    color: '#374151',
  },
  seguroTextSelected: {
    color: '#1A6B5A',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1A6B5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePasswordButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  changePasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
});