import theme from '@/themes/theme';
import { Stack } from 'expo-router';
export default function Layout() {
    return (
        <Stack screenOptions={{headerStyle: 
            {backgroundColor: theme.colors.darkAccent}, 
            headerTintColor: theme.colors.lightBackground,
            contentStyle: {backgroundColor: theme.colors.darkBackground}
        }}>
            <Stack.Screen name="index" options={{ title:'Your Forms' }} />
            <Stack.Screen name="[id]" options={{ title:'Form Detail' }} />
            <Stack.Screen name="response/[id]" options={{ title: 'New Response' }} />
        </Stack>
    );
}