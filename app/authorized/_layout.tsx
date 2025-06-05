import HeaderInfo from '@/components/HeaderInfo';
import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
import { getSecureItem } from '@/services/secure-storage-functions';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Layout() {
    const { isAuthenticated, isLoading, signOut } = useAuth();
    const { isConnected, isServerReachable } = useConnection();
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
                header: () => (
                <HeaderInfo username={username} connected={isServerReachable} />
                ),
            }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>

    );
}