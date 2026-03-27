import { Stack } from 'expo-router';

/**
 * Layout for the unauthenticated (auth) route group.
 *
 * Wraps the login and OTP verification screens inside an Expo Router `Stack`
 * with the header hidden so each screen controls its own full-bleed gradient layout.
 */
export default function AuthLayout() {
    return (
        <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
        </Stack>
    );
}