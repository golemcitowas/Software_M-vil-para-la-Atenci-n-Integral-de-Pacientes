import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────
// DATOS ESTÁTICOS
// ─────────────────────────────────────────
const ESPECIALIDADES = [
  { id: 'cardiologia', label: 'Cardiología', icon: '🫀' },
  { id: 'pediatria', label: 'Pediatría', icon: '😊' },
  { id: 'neurologia', label: 'Neurología', icon: '🧠' },
  { id: 'traumatologia', label: 'Traumatología', icon: '🦴' },
  { id: 'dermatologia', label: 'Dermatología', icon: '🩺' },
  { id: 'ginecologia', label: 'Ginecología', icon: '💊' },
];

const MEDICOS = {
  cardiologia: [
    { id: 'm1', nombre: 'Dr. Carlos Mendoza', especialidad: 'Cardiología General', rating: 4.9, disponibilidad: 'Hoy disponible', disponible: true },
    { id: 'm2', nombre: 'Dra. Elena Ruiz', especialidad: 'Cardiología Intervencionista', rating: 4.8, disponibilidad: 'Próxima: Mañana 09:00', disponible: false },
  ],
  pediatria: [
    { id: 'm3', nombre: 'Dr. Carlos Mendoza', especialidad: 'Pediatría General', rating: 4.9, disponibilidad: 'Hoy disponible', disponible: true },
    { id: 'm4', nombre: 'Dra. Elena Ruiz', especialidad: 'Neonatología', rating: 4.8, disponibilidad: 'Próxima: Mañana 09:00', disponible: false },
  ],
  neurologia: [
    { id: 'm5', nombre: 'Dr. Andrés Torres', especialidad: 'Neurología Clínica', rating: 4.7, disponibilidad: 'Hoy disponible', disponible: true },
  ],
  traumatologia: [
    { id: 'm6', nombre: 'Dr. Luis Paredes', especialidad: 'Traumatología y Ortopedia', rating: 4.6, disponibilidad: 'Hoy disponible', disponible: true },
  ],
  dermatologia: [
    { id: 'm7', nombre: 'Dra. Sofía Castro', especialidad: 'Dermatología Clínica', rating: 4.9, disponibilidad: 'Hoy disponible', disponible: true },
  ],
  ginecologia: [
    { id: 'm8', nombre: 'Dra. María López', especialidad: 'Ginecología y Obstetricia', rating: 4.8, disponibilidad: 'Hoy disponible', disponible: true },
  ],
};

const HORARIOS = ['08:30', '09:15', '10:00', '11:30', '15:00', '16:45'];

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const getDiasDelMes = (anio, mes) => {
  const primerDia = new Date(anio, mes, 1).getDay(); // 0=Dom
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  // Convertir domingo=0 a lunes=0
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const dias = [];
  for (let i = 0; i < offset; i++) {
    const diasAnterior = new Date(anio, mes, 0).getDate();
    dias.push({ dia: diasAnterior - offset + i + 1, mesActual: false });
  }
  for (let d = 1; d <= totalDias; d++) {
    dias.push({ dia: d, mesActual: true });
  }
  return dias;
};

// ─────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────
export default function CitasScreen({ navigation }) {
  const [pacienteId, setPacienteId] = useState(null);
  const [tab, setTab] = useState('nueva'); // 'nueva' | 'mis_citas'

  // Selecciones
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('pediatria');
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().getDate());
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  // Calendario
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());

  // Mis citas
  const [misCitas, setMisCitas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Modal detalle
  const [citaDetalle, setCitaDetalle] = useState(null);

  useEffect(() => {
    obtenerPaciente();
  }, []);

  useEffect(() => {
    if (tab === 'mis_citas' && pacienteId) {
      cargarMisCitas();
    }
  }, [tab, pacienteId]);

  // Auto-seleccionar primer médico al cambiar especialidad
  useEffect(() => {
    const medicos = MEDICOS[especialidadSeleccionada] || [];
    setMedicoSeleccionado(medicos[0] || null);
  }, [especialidadSeleccionada]);

  const obtenerPaciente = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('pacientes')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (data) setPacienteId(data.id);
  };

  const cargarMisCitas = async () => {
    setLoadingCitas(true);
    const { data } = await supabase
      .from('citas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_hora', { ascending: true });
    setMisCitas(data || []);
    setLoadingCitas(false);
  };

  const handleAgendarCita = async () => {
    if (!medicoSeleccionado) {
      Alert.alert('Selecciona un médico', 'Por favor elige un médico disponible.');
      return;
    }
    if (!horarioSeleccionado) {
      Alert.alert('Selecciona un horario', 'Por favor elige un horario disponible.');
      return;
    }
    if (!pacienteId) {
      Alert.alert('Error', 'No se pudo identificar tu cuenta.');
      return;
    }

    // Construir fecha + hora
    const [horas, minutos] = horarioSeleccionado.split(':').map(Number);
    const fechaCita = new Date(anioActual, mesActual, fechaSeleccionada, horas, minutos);

    setGuardando(true);
    const { error } = await supabase.from('citas').insert([{
      paciente_id: pacienteId,
      especialidad: ESPECIALIDADES.find(e => e.id === especialidadSeleccionada)?.label,
      medico: medicoSeleccionado.nombre,
      fecha_hora: fechaCita.toISOString(),
      estado: 'confirmada',
    }]);
    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo agendar la cita. Intenta de nuevo.');
      return;
    }

    Alert.alert(
      '✅ Cita agendada',
      `Tu cita con ${medicoSeleccionado.nombre} el ${fechaSeleccionada} de ${MESES[mesActual]} a las ${horarioSeleccionado} ha sido confirmada.`,
      [
        {
          text: 'Ver mis citas',
          onPress: () => { setTab('mis_citas'); cargarMisCitas(); },
        },
        { text: 'OK' },
      ]
    );
    setHorarioSeleccionado(null);
  };

  const handleCancelarCita = async (citaId) => {
    Alert.alert('Cancelar cita', '¿Estás seguro de que deseas cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', citaId);
          setCitaDetalle(null);
          cargarMisCitas();
        },
      },
    ]);
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hoyD = new Date();
    const mananaD = new Date(hoyD);
    mananaD.setDate(hoyD.getDate() + 1);
    const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const esHoy = d.toDateString() === hoyD.toDateString();
    const esMañana = d.toDateString() === mananaD.toDateString();
    if (esHoy) return `Hoy, ${hora}`;
    if (esMañana) return `Mañana, ${hora}`;
    return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}, ${hora}`;
  };

  const getBadgeColor = (estado) => {
    if (estado === 'confirmada') return { bg: '#D1FAE5', text: '#065F46' };
    if (estado === 'cancelada') return { bg: '#FEE2E2', text: '#991B1B' };
    return { bg: '#FEF3C7', text: '#92400E' };
  };

  const dias = getDiasDelMes(anioActual, mesActual);
  const medicosLista = MEDICOS[especialidadSeleccionada] || [];

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topLogoContainer}>
            <Text style={styles.topLogoIcon}>✚</Text>
          </View>
          <Text style={styles.topBrandName}>Clínica Bienestar</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'nueva' && styles.tabActive]}
          onPress={() => setTab('nueva')}
        >
          <Text style={[styles.tabText, tab === 'nueva' && styles.tabTextActive]}>Nueva Cita</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'mis_citas' && styles.tabActive]}
          onPress={() => { setTab('mis_citas'); if (pacienteId) cargarMisCitas(); }}
        >
          <Text style={[styles.tabText, tab === 'mis_citas' && styles.tabTextActive]}>Mis Citas</Text>
        </TouchableOpacity>
      </View>

      {/* ─── TAB: NUEVA CITA ─── */}
      {tab === 'nueva' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.pageTitle}>Nueva Cita</Text>
          <Text style={styles.pageSubtitle}>Selecciona los detalles para tu próxima consulta médica.</Text>

          {/* ESPECIALIDAD */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ESPECIALIDAD</Text>
            <TouchableOpacity><Text style={styles.verTodas}>Ver todas</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.especialidadesScroll}>
            {ESPECIALIDADES.map((esp) => (
              <TouchableOpacity
                key={esp.id}
                style={[styles.espCard, especialidadSeleccionada === esp.id && styles.espCardActive]}
                onPress={() => setEspecialidadSeleccionada(esp.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.espIcon}>{esp.icon}</Text>
                <Text style={[styles.espLabel, especialidadSeleccionada === esp.id && styles.espLabelActive]}>
                  {esp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* MÉDICOS */}
          <Text style={styles.sectionTitle}>MÉDICOS DISPONIBLES</Text>
          {medicosLista.map((medico) => (
            <TouchableOpacity
              key={medico.id}
              style={[styles.medicoCard, medicoSeleccionado?.id === medico.id && styles.medicoCardActive]}
              onPress={() => setMedicoSeleccionado(medico)}
              activeOpacity={0.8}
            >
              {/* Avatar */}
              <View style={[styles.medicoAvatar, { backgroundColor: medico.disponible ? '#D1FAE5' : '#E0E7FF' }]}>
                <Text style={styles.medicoAvatarIcon}>{medico.disponible ? '👨‍⚕️' : '👩‍⚕️'}</Text>
              </View>

              {/* Info */}
              <View style={styles.medicoInfo}>
                <Text style={styles.medicoNombre}>{medico.nombre}</Text>
                <Text style={styles.medicoEspecialidad}>{medico.especialidad}</Text>
                <View style={styles.medicoDisponRow}>
                  <Text style={[styles.medicoDisponIcon, { color: medico.disponible ? '#10B981' : '#F59E0B' }]}>
                    {medico.disponible ? '✅' : '🕐'}
                  </Text>
                  <Text style={[styles.medicoDispon, { color: medico.disponible ? '#059669' : '#D97706' }]}>
                    {medico.disponibilidad}
                  </Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingValue}>{medico.rating}</Text>
              </View>

              {/* Seleccionado */}
              {medicoSeleccionado?.id === medico.id && (
                <View style={styles.medicoCheck}>
                  <Text style={styles.medicoCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* CALENDARIO */}
          <Text style={styles.sectionTitle}>FECHA Y HORA</Text>
          <View style={styles.calendarioCard}>
            {/* Mes nav */}
            <View style={styles.calNavRow}>
              <Text style={styles.calMesAnio}>{MESES[mesActual]} {anioActual}</Text>
              <View style={styles.calNavBtns}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => {
                    if (mesActual === 0) { setMesActual(11); setAnioActual(a => a - 1); }
                    else setMesActual(m => m - 1);
                  }}
                >
                  <Text style={styles.calNavBtnText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => {
                    if (mesActual === 11) { setMesActual(0); setAnioActual(a => a + 1); }
                    else setMesActual(m => m + 1);
                  }}
                >
                  <Text style={styles.calNavBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cabecera días */}
            <View style={styles.calDiasHeader}>
              {DIAS_SEMANA.map((d, i) => (
                <Text key={i} style={styles.calDiaHeaderText}>{d}</Text>
              ))}
            </View>

            {/* Grid días */}
            <View style={styles.calGrid}>
              {dias.map((item, index) => {
                const esHoyDia =
                  item.mesActual &&
                  item.dia === hoy.getDate() &&
                  mesActual === hoy.getMonth() &&
                  anioActual === hoy.getFullYear();
                const seleccionado = item.mesActual && item.dia === fechaSeleccionada;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calDiaBtn,
                      seleccionado && styles.calDiaBtnSelected,
                      esHoyDia && !seleccionado && styles.calDiaBtnHoy,
                    ]}
                    onPress={() => item.mesActual && setFechaSeleccionada(item.dia)}
                    disabled={!item.mesActual}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calDiaText,
                      !item.mesActual && styles.calDiaTextFuera,
                      seleccionado && styles.calDiaTextSelected,
                      esHoyDia && !seleccionado && styles.calDiaTextHoy,
                    ]}>
                      {item.dia}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Horarios */}
            <Text style={styles.horariosLabel}>Horarios Disponibles</Text>
            <View style={styles.horariosGrid}>
              {HORARIOS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.horarioBtn, horarioSeleccionado === h && styles.horarioBtnSelected]}
                  onPress={() => setHorarioSeleccionado(h)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.horarioBtnText, horarioSeleccionado === h && styles.horarioBtnTextSelected]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ─── TAB: MIS CITAS ─── */}
      {tab === 'mis_citas' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Mis Citas</Text>
          <Text style={styles.pageSubtitle}>Historial y próximas consultas agendadas.</Text>

          {loadingCitas ? (
            <ActivityIndicator size="large" color="#1A6B5A" style={{ marginTop: 40 }} />
          ) : misCitas.length === 0 ? (
            <View style={styles.emptyCitas}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Sin citas registradas</Text>
              <Text style={styles.emptySubtitle}>Agenda tu primera cita médica</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setTab('nueva')}>
                <Text style={styles.emptyBtnText}>Agendar cita →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            misCitas.map((cita) => {
              const badge = getBadgeColor(cita.estado);
              return (
                <TouchableOpacity
                  key={cita.id}
                  style={styles.citaListCard}
                  onPress={() => setCitaDetalle(cita)}
                  activeOpacity={0.85}
                >
                  <View style={styles.citaListLeft}>
                    <View style={styles.citaListIconWrapper}>
                      <Text style={styles.citaListIcon}>📅</Text>
                    </View>
                    <View>
                      <Text style={styles.citaListEspecialidad}>{cita.especialidad}</Text>
                      <Text style={styles.citaListMedico}>{cita.medico}</Text>
                      <Text style={styles.citaListFecha}>{formatFecha(cita.fecha_hora)}</Text>
                    </View>
                  </View>
                  <View style={[styles.citaListBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.citaListBadgeText, { color: badge.text }]}>
                      {cita.estado?.charAt(0).toUpperCase() + cita.estado?.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ─── BOTÓN FLOTANTE AGENDAR ─── */}
      {tab === 'nueva' && (
        <TouchableOpacity
          style={[styles.fabBtn, guardando && styles.fabBtnDisabled]}
          onPress={handleAgendarCita}
          disabled={guardando}
          activeOpacity={0.85}
        >
          {guardando
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.fabBtnText}>✓</Text>
          }
        </TouchableOpacity>
      )}

      {/* ─── MODAL DETALLE CITA ─── */}
      <Modal visible={!!citaDetalle} transparent animationType="slide" onRequestClose={() => setCitaDetalle(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de Cita</Text>
              <TouchableOpacity onPress={() => setCitaDetalle(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {citaDetalle && (
              <>
                <View style={styles.modalIconRow}>
                  <Text style={styles.modalBigIcon}>📅</Text>
                </View>
                <Text style={styles.modalEspecialidad}>{citaDetalle.especialidad}</Text>
                <Text style={styles.modalMedico}>{citaDetalle.medico}</Text>
                <Text style={styles.modalFecha}>{formatFecha(citaDetalle.fecha_hora)}</Text>

                <View style={[styles.modalBadge, { backgroundColor: getBadgeColor(citaDetalle.estado).bg }]}>
                  <Text style={[styles.modalBadgeText, { color: getBadgeColor(citaDetalle.estado).text }]}>
                    {citaDetalle.estado?.charAt(0).toUpperCase() + citaDetalle.estado?.slice(1)}
                  </Text>
                </View>

                {citaDetalle.estado !== 'cancelada' && (
                  <TouchableOpacity
                    style={styles.cancelarBtn}
                    onPress={() => handleCancelarCita(citaDetalle.id)}
                  >
                    <Text style={styles.cancelarBtnText}>Cancelar cita</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── BOTTOM NAV ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIconActive}>📋</Text>
          <Text style={styles.navLabelActive}>Citas</Text>
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

// ─────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F4F7' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  topLogoContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1A6B5A', alignItems: 'center', justifyContent: 'center' },
  topLogoIcon: { fontSize: 16, color: '#FFFFFF', fontWeight: 'bold' },
  topBrandName: { fontSize: 16, fontWeight: '700', color: '#1A6B5A', marginLeft: 8 },

  // Tabs
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1A6B5A' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#1A6B5A' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Page header
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 18 },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  verTodas: { fontSize: 13, color: '#1A6B5A', fontWeight: '600' },

  // Especialidades
  especialidadesScroll: { marginBottom: 4 },
  espCard: { alignItems: 'center', justifyContent: 'center', width: 90, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', marginRight: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  espCardActive: { borderColor: '#1A6B5A', backgroundColor: '#F0FAF7' },
  espIcon: { fontSize: 26, marginBottom: 6 },
  espLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
  espLabelActive: { color: '#1A6B5A' },

  // Médicos
  medicoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  medicoCardActive: { borderColor: '#1A6B5A', backgroundColor: '#F0FAF7' },
  medicoAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  medicoAvatarIcon: { fontSize: 26 },
  medicoInfo: { flex: 1 },
  medicoNombre: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  medicoEspecialidad: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  medicoDisponRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  medicoDisponIcon: { fontSize: 11 },
  medicoDispon: { fontSize: 11, fontWeight: '600' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  ratingStar: { fontSize: 13, color: '#F59E0B', marginRight: 2 },
  ratingValue: { fontSize: 13, fontWeight: '700', color: '#374151' },
  medicoCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1A6B5A', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  medicoCheckText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Calendario
  calendarioCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calMesAnio: { fontSize: 15, fontWeight: '700', color: '#111827' },
  calNavBtns: { flexDirection: 'row', gap: 8 },
  calNavBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  calNavBtnText: { fontSize: 18, color: '#374151', fontWeight: '700' },
  calDiasHeader: { flexDirection: 'row', marginBottom: 6 },
  calDiaHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDiaBtn: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100, marginVertical: 2 },
  calDiaBtnSelected: { backgroundColor: '#1A6B5A' },
  calDiaBtnHoy: { borderWidth: 1.5, borderColor: '#1A6B5A' },
  calDiaText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  calDiaTextFuera: { color: '#D1D5DB' },
  calDiaTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  calDiaTextHoy: { color: '#1A6B5A', fontWeight: '700' },

  // Horarios
  horariosLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 10 },
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  horarioBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  horarioBtnSelected: { backgroundColor: '#1A6B5A', borderColor: '#1A6B5A' },
  horarioBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  horarioBtnTextSelected: { color: '#FFFFFF' },

  // FAB
  fabBtn: { position: 'absolute', bottom: 90, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1A6B5A', alignItems: 'center', justifyContent: 'center', shadowColor: '#1A6B5A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  fabBtnDisabled: { opacity: 0.6 },
  fabBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },

  // Mis citas lista
  citaListCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  citaListLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  citaListIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FAF7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  citaListIcon: { fontSize: 22 },
  citaListEspecialidad: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  citaListMedico: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  citaListFecha: { fontSize: 12, color: '#1A6B5A', fontWeight: '600' },
  citaListBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  citaListBadgeText: { fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyCitas: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  emptyBtn: { backgroundColor: '#1A6B5A', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 20, color: '#9CA3AF', fontWeight: '600' },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalBigIcon: { fontSize: 48 },
  modalEspecialidad: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  modalMedico: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 4 },
  modalFecha: { fontSize: 14, color: '#1A6B5A', fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  modalBadge: { alignSelf: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 24 },
  modalBadgeText: { fontSize: 13, fontWeight: '700' },
  cancelarBtn: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelarBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },

  // Bottom nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: 20, paddingTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22, marginBottom: 4 },
  navIconActive: { fontSize: 22, marginBottom: 4 },
  navLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  navLabelActive: { fontSize: 11, color: '#1A6B5A', fontWeight: '700' },
});