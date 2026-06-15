import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [paciente, setPaciente] = useState(null);
  const [proximaCita, setProximaCita] = useState(null);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [indicadores, setIndicadores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Obtener usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigation.replace('Login');
        return;
      }

      // 2. Obtener datos del paciente
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (patientError) {
        console.error('Error al obtener paciente:', patientError);
        setLoading(false);
        return;
      }

      setPaciente(patientData);

      // 3. Obtener próxima cita (solo las confirmadas que no han pasado)
      const hoy = new Date().toISOString();
      const { data: citasData, error: citasError } = await supabase
      .from('citas')
      .select('*')
      .eq('paciente_id', patientData.id)
      .eq('estado', 'confirmada')  // ← SOLO CITAS CONFIRMADAS
      .gte('fecha_hora', hoy)
      .order('fecha_hora', { ascending: true })
      .limit(1);

      if (citasError) {
      console.error('Error al obtener citas:', citasError);
    }

  // Tomar la primera cita si existe
  if (citasData && citasData.length > 0) {
  setProximaCita(citasData[0]);
  } else {
  setProximaCita(null);
  }

      // 4. Mensajes no leídos (opcional)
      const { count } = await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .eq('paciente_id', patientData.id)
        .eq('leido', false);

      setMensajesNoLeidos(count || 0);

      // 5. Indicadores de salud (opcional)
      const { data: indicadorData } = await supabase
        .from('indicadores_salud')
        .select('*')
        .eq('paciente_id', patientData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setIndicadores(indicadorData);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const getNombreSaludo = () => {
    if (!paciente) return 'Paciente';
    if (paciente.nombre) {
      return paciente.nombre.split(' ')[0];
    }
    return 'Paciente';
  };

  const formatFechaCita = (fechaISO) => {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const esManana =
      fecha.getDate() === manana.getDate() &&
      fecha.getMonth() === manana.getMonth() &&
      fecha.getFullYear() === manana.getFullYear();

    const esHoy =
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear();

    const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    if (esHoy) return `Hoy, ${hora}`;
    if (esManana) return `Mañana, ${hora}`;
    return `${fecha.getDate()} ${getMesAbreviado(fecha.getMonth())}, ${hora}`;
  };

  const getMesAbreviado = (mes) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mes];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 18) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A6B5A" />
          <Text style={styles.loadingText}>Cargando tu información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topLogoContainer}>
            <Text style={styles.topLogoIcon}>✚</Text>
          </View>
          <Text style={styles.topBrandName}>Clínica Bienestar</Text>
        </View>
        <TouchableOpacity style={styles.avatarButton} onPress={handleLogout}>
          <Text style={styles.avatarText}>
            {paciente?.nombre?.charAt(0)?.toUpperCase() || 'P'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>PANEL DEL PACIENTE</Text>
        </View>

        <Text style={styles.greetingName}>¡Hola, {getNombreSaludo()}!</Text>
        <Text style={styles.greetingTime}>{getGreeting()}</Text>
        <Text style={styles.greetingSubtitle}>¿Cómo te sientes el día de hoy?</Text>

        {/* Recordatorio de medicamento */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderIconWrapper}>
            <Text style={styles.reminderIcon}>⏰</Text>
          </View>
          <View style={styles.reminderTextWrapper}>
            <Text style={styles.reminderLabel}>Recordatorio de medicamento</Text>
            <Text style={styles.reminderValue}>Tomar Paracetamol a las 4:00 PM</Text>
          </View>
        </View>

        {/* Próxima Cita */}
        <Text style={styles.sectionTitle}>Próxima Cita</Text>
        {proximaCita ? (
          <TouchableOpacity
            style={styles.citaCard}
            onPress={() => navigation.navigate('Citas')}
            activeOpacity={0.85}
          >
            <View style={styles.citaCardTop}>
              <View style={styles.citaIconWrapper}>
                <Text style={styles.citaIcon}>📅</Text>
              </View>
              <View style={styles.citaBadge}>
                <Text style={styles.citaBadgeText}>{proximaCita.estado || 'Confirmada'}</Text>
              </View>
            </View>
            <Text style={styles.citaEspecialidad}>{proximaCita.especialidad || 'Consulta General'}</Text>
            <Text style={styles.citaMedico}>{proximaCita.medico || 'Médico asignado'}</Text>
            <View style={styles.citaFechaRow}>
              <Text style={styles.citaFechaIcon}>🕐</Text>
              <Text style={styles.citaFecha}>{formatFechaCita(proximaCita.fecha_hora)}</Text>
              <Text style={styles.citaArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.noCitaCard}
            onPress={() => navigation.navigate('Citas')}
            activeOpacity={0.85}
          >
            <Text style={styles.noCitaText}>No tienes citas próximas</Text>
            <Text style={styles.noCitaLink}>Agendar una cita →</Text>
          </TouchableOpacity>
        )}

        {/* Acceso Rápido */}
      <Text style={styles.sectionTitle}>Acceso Rápido</Text>

      <View style={styles.quickAccessRow}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('Citas')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickCardIcon}>📅</Text>
          <Text style={styles.quickCardLabel}>Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickCardIcon}>🧪</Text>
          <Text style={styles.quickCardLabel}>Resultados</Text>
        </TouchableOpacity>
      </View>


      <TouchableOpacity
        style={styles.mensajesCard}
        onPress={() => navigation.navigate('Recetas')}
        activeOpacity={0.8}
      >
        <View style={styles.mensajesLeft}>

          <Text style={styles.quickCardIcon}>💊</Text>

          <Text style={styles.quickCardLabel}>Recetas</Text>

        </View>

        {mensajesNoLeidos > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{mensajesNoLeidos}</Text>
          </View>
        )}

      </TouchableOpacity>

        {/* Indicadores Recientes */}
        <Text style={styles.sectionTitle}>Indicadores Recientes</Text>
        {indicadores ? (
          <View style={styles.indicadorCard}>
            <View style={styles.indicadorLeft}>
              <Text style={styles.indicadorIcon}>❤️</Text>
              <View>
                <Text style={styles.indicadorNombre}>{indicadores.nombre || 'Presión Arterial'}</Text>
                <Text style={styles.indicadorValor}>{indicadores.valor || '120/80 mmHg'}</Text>
              </View>
            </View>
            <View style={styles.indicadorBadge}>
              <Text style={styles.indicadorBadgeText}>{indicadores.estado || 'Normal'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.indicadorCard}>
            <View style={styles.indicadorLeft}>
              <Text style={styles.indicadorIcon}>❤️</Text>
              <View>
                <Text style={styles.indicadorNombre}>Presión Arterial</Text>
                <Text style={styles.indicadorValor}>Sin datos aún</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navLabelActive}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Citas')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Citas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Mensajes')}>
          <Text style={styles.navIcon}>✉️</Text>
          <Text style={styles.navLabel}>Mensajes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1A6B5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLogoIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  topBrandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A6B5A',
    marginLeft: 8,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A6B5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  greetingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A6B5A',
    marginTop: 4,
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  reminderIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderIcon: {
    fontSize: 18,
  },
  reminderTextWrapper: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  reminderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  citaCard: {
    backgroundColor: '#1A6B5A',
    borderRadius: 18,
    padding: 20,
  },
  citaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  citaIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  citaIcon: {
    fontSize: 20,
  },
  citaBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  citaBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  citaEspecialidad: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  citaMedico: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
  },
  citaFechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citaFechaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  citaFecha: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    flex: 1,
  },
  citaArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noCitaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noCitaText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  noCitaLink: {
    fontSize: 14,
    color: '#1A6B5A',
    fontWeight: '700',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  mensajesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  mensajesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mensajesIcon: {
    fontSize: 22,
  },
  mensajesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  indicadorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  indicadorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicadorIcon: {
    fontSize: 22,
  },
  indicadorNombre: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  indicadorValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  indicadorBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  indicadorBadgeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  navIconActive: {
    fontSize: 22,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#1A6B5A',
    fontWeight: '700',
  },
  recetasCard: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  paddingVertical: 16,
  paddingHorizontal: 20,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
},
recetasIcon: {
  fontSize: 22,
  marginRight: 10,
},
recetasLabel: {
  fontSize: 15,
  fontWeight: '600',
  color: '#374151',
},
recetasArrow: {
  fontSize: 16,
  color: '#1A6B5A',
  fontWeight: 'bold',
  marginLeft: 10,
},
});