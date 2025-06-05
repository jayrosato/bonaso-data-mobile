import Theme from '@/components/Theme';
import { ConnectionTest } from '@/context/ConnectionContext';
import { InactivityProvider } from '@/context/InactivityContext';
import theme from '@/themes/theme';
import { Stack } from 'expo-router';
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AppContent() {
  const { signOut } = useAuth();

  return (
    <InactivityProvider onTimeout={signOut}>
      <ConnectionTest>
        <Theme>
            <Stack screenOptions={{ headerShown: false, contentStyle: {backgroundColor: theme.colors.darkBackground} }} />
            <FlashMessage position="top" />
        </Theme>
      </ConnectionTest>
    </InactivityProvider>
  );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GestureHandlerRootView>
  );
}

