/**
 * CMS Settings Screen — System configuration (SUPERADMIN only).
 *
 * TODO: implement full settings UI in a future sprint.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';

export default function CmsSettings() {
  const { isAuthenticated, cmsUser } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/cms/login' as any);
    } else if (cmsUser && cmsUser.role !== 'SUPERADMIN') {
      router.replace('/cms/dashboard' as any);
    }
  }, [isAuthenticated, cmsUser]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>⚙️ Configuración</Text>
        <Text style={styles.pageSubtitle}>Solo visible para SUPERADMIN</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚧 En construcción</Text>
        <Text style={styles.cardText}>
          El módulo de configuración estará disponible en el próximo sprint.{'\n\n'}
          Aquí se gestionarán:{'\n'}
          · Parámetros del sistema{'\n'}
          · Gestión de roles{'\n'}
          · Configuración de correo / OTP{'\n'}
          · Integraciones externas
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 28,
    paddingBottom: 48,
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
});
