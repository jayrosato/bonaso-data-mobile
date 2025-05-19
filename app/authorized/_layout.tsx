import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
import { getSecureItem } from '@/services/secure-storage-functions';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text } from 'react-native';

export default function Layout() {
    const { isAuthenticated, isLoading } = useAuth();
    const { isConnected, isServerReachable } = useConnection();
    const { signOut } = useAuth();
    const[username, setUsername] = useState(null)
    const [accessLevel, setAccessLevel] = useState(null)

    useEffect(() => {
        const loadUserData = async () =>{
            const storedCredentials = await getSecureItem('user_credentials')
            if(storedCredentials){
                const cred = JSON.parse(storedCredentials)
                setUsername(cred.username)
                setAccessLevel(cred.access_level)
            }
        }
        if(isAuthenticated){
            loadUserData()
        }
    }, [isAuthenticated])

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }
    
    return (
        <Stack
            screenOptions={{
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerTitle: () => <Text>Welcome, {accessLevel} {username}!</Text>,
            headerLeft: () => <>
                    <Ionicons name={"wifi"} color={isServerReachable ? 'green' : 'grey'}/>
                    {isServerReachable ? 
                    <Text>You are online!</Text>:<Text>You are operating offline.</Text>
                }
                </>,
            headerRight: () => <Button onPress={() => signOut()} title="Log Out" />
        }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}