import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

export const LoginScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { requestOtp, verifyOtp, loading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');

  const handleRequestOtp = async () => {
    if (!email || !password) return;
    const success = await requestOtp(email, password);
    if (success) {
      setStep('verify');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    await verifyOtp(otp);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Conectar Luki Play</Text>
        
        {error && <Text style={styles.error}>{error}</Text>}

        {step === 'request' ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.textSecondary }]}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Contraseña</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.textSecondary }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Avanzar</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Ingresa el código OTP enviado a tu correo.
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, textAlign: 'center', fontSize: 24 }]}
              value={otp}
              onChangeText={setOtp}
              placeholder="XXXXXX"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Ingresar</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setStep('request')}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Volver atrás</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    marginBottom: 15,
    textAlign: 'center',
  }
});
