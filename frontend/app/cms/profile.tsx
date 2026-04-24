import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { PrimaryButton, SecondaryButton, TextInputField } from '../../components/cms/CmsComponents';
import { adminUpdateUser } from '../../services/api/adminApi';
import { cmsChangePassword } from '../../services/api/cmsApi';
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
  const { theme } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold }}>
        {label} {required ? <Text style={{ color: theme.danger }}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export default function CmsProfileScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { profile, accessToken, refreshProfile, logout } = useCmsStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!profile) return; // _layout.tsx handles redirect when profile is null
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setIdNumber(profile.idNumber ?? '');
    setEmail(profile.email ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo actualizar el perfil.' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSaving(false);
    }
  }

  const canChangePwd = useMemo(() => {
    return Boolean(
      currentPassword.trim() &&
      newPassword.length >= 8 &&
      newPassword === confirmPassword,
    );
  }, [currentPassword, newPassword, confirmPassword]);

  async function handleChangePassword() {
    if (!accessToken || !canChangePwd) return;
    setIsChangingPwd(true);
    setPwdFeedback(null);
    try {
      await cmsChangePassword(accessToken, currentPassword, newPassword);
      setPwdFeedback({ type: 'success', message: 'Contraseña actualizada. Redirigiendo al login...' });
      // All sessions are revoked server-side — clearing local state triggers
      // the _layout.tsx guard which redirects to /cms/login automatically
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      setPwdFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.' });
      setTimeout(() => setPwdFeedback(null), 4000);
      setIsChangingPwd(false);
    }
  }

  if (!profile) return null;

  const lastLoginLabel = profile.lastLoginAt
    ? new Date(profile.lastLoginAt).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Sin registros';

  const roleLabels: Record<string, { title: string; subtitle: string }> = {
    superadmin: { title: 'Perfil del Super Administrador', subtitle: 'Acceso total al sistema. Gestiona roles, permisos y configuración global.' },
    admin:      { title: 'Perfil del Administrador',       subtitle: 'Edita tus datos principales de acceso y consulta la actividad reciente.' },
    soporte:    { title: 'Perfil de Soporte',              subtitle: 'Edita tus datos de acceso y revisa tu actividad reciente.' },
  };
  const roleKey = profile.role?.toLowerCase() ?? 'admin';
  const roleLabel = roleLabels[roleKey] ?? roleLabels.admin;

  return (
    <CmsShell breadcrumbs={[{ label: 'Perfil' }]} pageIcon="user-circle">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={{ maxWidth: 880, width: '100%', alignSelf: 'center', gap: 18 }}>
          <View
            style={{
              backgroundColor: isDark ? theme.cardBgInner : '#FFFFFF',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isDark ? theme.border : 'rgba(36,0,70,0.10)',
              padding: 22,
              gap: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <View>
                <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 24, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>
                  {roleLabel.title}
                </Text>
                <Text style={{ color: isDark ? theme.textSec : 'rgba(36,0,70,0.65)', fontSize: 13, marginTop: 4, fontFamily: FONT_FAMILY.body }}>
                  {roleLabel.subtitle}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.accentSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.accentBorder }}>
                <FontAwesome name="clock-o" size={14} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
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
              <View style={{ flex: 1, minWidth: 260, backgroundColor: isDark ? theme.liftBg : 'rgba(96,38,158,0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(96,38,158,0.10)' }}>
                <Text style={{ color: isDark ? theme.textMuted : 'rgba(36,0,70,0.60)', fontSize: 11, fontWeight: '700', marginBottom: 6, fontFamily: FONT_FAMILY.bodyBold }}>
                  ROL
                </Text>
                <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 16, fontWeight: '800', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {profile.role.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 260, backgroundColor: isDark ? theme.liftBg : 'rgba(96,38,158,0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(96,38,158,0.10)' }}>
                <Text style={{ color: isDark ? theme.textMuted : 'rgba(36,0,70,0.60)', fontSize: 11, fontWeight: '700', marginBottom: 6, fontFamily: FONT_FAMILY.bodyBold }}>
                  ESTADO
                </Text>
                <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 16, fontWeight: '800', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {profile.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <PrimaryButton label={isSaving ? 'Guardando...' : 'Guardar cambios'} icon="save" onPress={handleSave} disabled={!canSave || isSaving} />
              <SecondaryButton label="Volver" icon="arrow-left" onPress={() => router.back()} disabled={isSaving} />
              {isSaving && <ActivityIndicator size="small" color={theme.accent} style={{ alignSelf: 'center' }} />}
            </View>
          </View>

          {/* ── Cambio de contraseña ── */}
          <View
            style={{
              backgroundColor: isDark ? theme.cardBgInner : '#FFFFFF',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isDark ? theme.border : 'rgba(36,0,70,0.10)',
              padding: 22,
              gap: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(209,16,90,0.10)', borderWidth: 1, borderColor: 'rgba(209,16,90,0.20)', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesome name="lock" size={15} color="#D1105A" />
              </View>
              <View>
                <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 18, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>
                  Cambiar contraseña
                </Text>
                <Text style={{ color: isDark ? theme.textSec : 'rgba(36,0,70,0.65)', fontSize: 12, marginTop: 2, fontFamily: FONT_FAMILY.body }}>
                  Al guardar, todas tus sesiones activas serán cerradas.
                </Text>
              </View>
            </View>

            {pwdFeedback && (
              <View style={{ backgroundColor: pwdFeedback.type === 'success' ? 'rgba(23,209,198,0.12)' : 'rgba(209,16,90,0.12)', borderRadius: 12, borderWidth: 1, borderColor: pwdFeedback.type === 'success' ? 'rgba(23,209,198,0.24)' : 'rgba(209,16,90,0.22)', padding: 12 }}>
                <Text style={{ color: pwdFeedback.type === 'success' ? '#17D1C6' : '#FF7AA2', fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {pwdFeedback.message}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Contraseña actual" required>
                  <TextInputField
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                </ProfileField>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Nueva contraseña" required>
                  <TextInputField
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                  />
                </ProfileField>
              </View>
              <View style={{ flex: 1, minWidth: 260 }}>
                <ProfileField label="Confirmar nueva contraseña" required>
                  <TextInputField
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repite la nueva contraseña"
                    secureTextEntry
                  />
                </ProfileField>
              </View>
            </View>

            {newPassword.length > 0 && newPassword.length < 8 && (
              <Text style={{ color: theme.danger, fontSize: 12, fontFamily: FONT_FAMILY.body }}>
                La contraseña debe tener al menos 8 caracteres.
              </Text>
            )}
            {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={{ color: theme.danger, fontSize: 12, fontFamily: FONT_FAMILY.body }}>
                Las contraseñas no coinciden.
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <PrimaryButton
                label={isChangingPwd ? 'Actualizando...' : 'Actualizar contraseña'}
                icon="key"
                onPress={handleChangePassword}
                disabled={!canChangePwd || isChangingPwd}
              />
              {isChangingPwd && <ActivityIndicator size="small" color={theme.accent} style={{ alignSelf: 'center' }} />}
            </View>
          </View>
        </View>
      </ScrollView>
    </CmsShell>
  );
}