import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { PrimaryButton, SecondaryButton, TextInputField } from '../../components/cms/CmsComponents';
import { adminUpdateUser } from '../../services/api/adminApi';
import { useCmsStore } from '../../services/cmsStore';
import { useTheme } from '../../hooks/useTheme';
import { FONT_FAMILY } from '../../styles/typography';

type Feedback = { type: 'success' | 'error'; message: string } | null;

function ProfileField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold }}>
        {label} {required ? <Text style={{ color: C.danger }}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export default function CmsProfileScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { profile, accessToken, refreshProfile } = useCmsStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!profile) {
      router.replace('/cms/login' as never);
      return;
    }
    // Solo actualizar los campos si cambia el id del perfil
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setIdNumber(profile.idNumber ?? '');
    setEmail(profile.email ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, router]);

  const canSave = useMemo(() => {
    return Boolean(firstName.trim() && lastName.trim() && email.trim());
  }, [email, firstName, lastName]);

  async function handleSave() {
    if (!profile || !accessToken || !canSave) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      await adminUpdateUser(accessToken, profile.id, {
        nombre: `${firstName.trim()} ${lastName.trim()}`.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        idNumber: idNumber.trim() || undefined,
        email: email.trim().toLowerCase(),
        role: profile.role,
        status: profile.status,
      });
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Perfil actualizado correctamente.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo actualizar el perfil.' });
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile) return null;

  const lastLoginLabel = profile.lastLoginAt
    ? new Date(profile.lastLoginAt).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Sin registros';

  return (
    <CmsShell breadcrumbs={[{ label: 'Perfil' }]} pageIcon="user-circle">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={{ maxWidth: 880, width: '100%', alignSelf: 'center', gap: 18 }}>
          <View
            style={{
              backgroundColor: isDark ? C.bgTertiary : '#FFFFFF',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isDark ? C.border : 'rgba(36,0,70,0.10)',
              padding: 22,
              gap: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <View>
                <Text style={{ color: isDark ? C.text : '#240046', fontSize: 24, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>
                  Perfil del administrador
                </Text>
                <Text style={{ color: isDark ? C.textDim : 'rgba(36,0,70,0.65)', fontSize: 13, marginTop: 4, fontFamily: FONT_FAMILY.body }}>
                  Edita tus datos principales de acceso y consulta la actividad reciente.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.accentBorder }}>
                <FontAwesome name="clock-o" size={14} color={C.accent} />
                <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {lastLoginLabel}
                </Text>
              </View>
            </View>

            {feedback && (
              <View style={{ backgroundColor: feedback.type === 'success' ? 'rgba(23,209,198,0.12)' : 'rgba(209,16,90,0.12)', borderRadius: 12, borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(23,209,198,0.24)' : 'rgba(209,16,90,0.22)', padding: 12 }}>
                <Text style={{ color: feedback.type === 'success' ? '#17D1C6' : '#FF7AA2', fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {feedback.message}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Nombres" required>
                  <TextInputField value={firstName} onChangeText={setFirstName} placeholder="Carlos" />
                </ProfileField>
              </View>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Apellidos" required>
                  <TextInputField value={lastName} onChangeText={setLastName} placeholder="Luki" />
                </ProfileField>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Cédula de identidad">
                  <TextInputField value={idNumber} onChangeText={setIdNumber} placeholder="0102030405" />
                </ProfileField>
              </View>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Correo electrónico" required>
                  <TextInputField value={email} onChangeText={setEmail} placeholder="usuario@lukiplay.com" />
                </ProfileField>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ flex: 1, minWidth: 260, backgroundColor: isDark ? C.lift : 'rgba(96,38,158,0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: isDark ? C.border : 'rgba(96,38,158,0.10)' }}>
                <Text style={{ color: isDark ? C.muted : 'rgba(36,0,70,0.60)', fontSize: 11, fontWeight: '700', marginBottom: 6, fontFamily: FONT_FAMILY.bodyBold }}>
                  ROL
                </Text>
                <Text style={{ color: isDark ? C.text : '#240046', fontSize: 16, fontWeight: '800', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {profile.role.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 260, backgroundColor: isDark ? C.lift : 'rgba(96,38,158,0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: isDark ? C.border : 'rgba(96,38,158,0.10)' }}>
                <Text style={{ color: isDark ? C.muted : 'rgba(36,0,70,0.60)', fontSize: 11, fontWeight: '700', marginBottom: 6, fontFamily: FONT_FAMILY.bodyBold }}>
                  ESTADO
                </Text>
                <Text style={{ color: isDark ? C.text : '#240046', fontSize: 16, fontWeight: '800', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {profile.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <PrimaryButton label={isSaving ? 'Guardando...' : 'Guardar cambios'} icon="save" onPress={handleSave} disabled={!canSave || isSaving} />
              <SecondaryButton label="Volver" icon="arrow-left" onPress={() => router.back()} disabled={isSaving} />
              {isSaving && <ActivityIndicator size="small" color={C.accent} style={{ alignSelf: 'center' }} />}
            </View>
          </View>
        </View>
      </ScrollView>
    </CmsShell>
  );
}