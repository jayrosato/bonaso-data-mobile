import { Stack } from 'expo-router';

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title:'Your Forms' }} />
            <Stack.Screen name="[id]" options={{ title:'Form Detail' }} />
            <Stack.Screen name="response/[id]" options={{ title: 'New Response' }} />
        </Stack>
    );
}