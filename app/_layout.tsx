import { ConnectionTest } from '@/context/ConnectionContext';
import { Stack } from 'expo-router';
import FlashMessage from "react-native-flash-message";
import { AuthProvider } from '../context/AuthContext';
export default function RootLayout() {
    return (
        <AuthProvider>
            <ConnectionTest>
                <Stack screenOptions={{ headerShown: false }} />
                <FlashMessage position="top" />
            </ConnectionTest>
        </AuthProvider>
  );
}

