import { ConnectionTest } from '@/context/ConnectionContext';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
export default function RootLayout() {
    return (
        <AuthProvider>
            <ConnectionTest>
                <Stack screenOptions={{ headerShown: false }} />
            </ConnectionTest>
        </AuthProvider>
  );
}

