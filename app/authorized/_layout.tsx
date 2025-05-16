import { useAuth } from '@/context/AuthContext';
import { getSecureItem } from '@/services/secure-storage-functions';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text } from 'react-native';

export default function Layout() {
    const { isAuthenticated, isLoading } = useAuth();
    const { signOut } = useAuth();
    const[username, setUsername] = useState(null)
    const [accessLevel, setAccessLevel] = useState(null)

    useEffect(() => {
        const loadUserData = async () =>{
            const username = await getSecureItem('username')
            setUsername(username)
            const accesLevel = await getSecureItem('access_level')
            setAccessLevel(accesLevel)
        }
        if(isAuthenticated){
            loadUserData()
        }
    })

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }
    
    return (
        <Stack
            screenOptions={{
            headerStyle: {
            backgroundColor: '#fff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
            fontWeight: 'bold',
            },
            headerTitle: () => <Text>Welcome, {accessLevel} {username}!</Text>,
            headerRight: () => <Button onPress={() => signOut()} title="Log Out" />
        }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}