import { ThemedText } from '@/components/ThemedText';
import { useConnection } from '@/context/ConnectionContext';
import { getSecureItem } from '@/services/secure-storage-functions';
import { cleanLocalStorage } from '@/sync-load-queries/clean-local-storage';
import { syncResponses } from '@/sync-load-queries/sync-responses';
import theme from '@/themes/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import initDatabase from '../../database/initDB';

export default function HomeScreen() {
    const { isConnected, isServerReachable } = useConnection();
    const[username, setUsername] = useState(null)
    const router = useRouter();

    const [daysLeft, setDaysLeft] = useState(0)
    const loadDaysLeft = async () =>{
        const storedCredentials = await getSecureItem('user_credentials')
        if(storedCredentials){
            const cred = JSON.parse(storedCredentials)
            const now = new Date();
            const createdOn = new Date(cred.created_on);
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const expiresOn = new Date(createdOn.getTime() + THIRTY_DAYS_MS);
            setDaysLeft(Math.ceil((expiresOn - now) / (1000 * 60 * 60 * 24)));
        }
    }
    const showAlert = () => {
        Alert.alert("You are offline...", `We could't establish a connection to the server. Your offline login will expire in ${daysLeft} days.`,
            [
                {text: "Got it!", style: "cancel"},
                {text: "More info", onPress: () => router.push({pathname: '/authorized/offlineInfo'})}
            ],
            { cancelable: false }
        );
    }
    useEffect(() => {
            const getUsername = async() => {
                const storedCredentials = await getSecureItem('user_credentials')
                if(storedCredentials){
                    const cred = JSON.parse(storedCredentials);
                    const username = cred.username;
                    setUsername(username);
                }
            }
            getUsername();
            const syncData = async () => {
                await initDatabase();
                if(isServerReachable){
                    await syncResponses();
                }
                await cleanLocalStorage();
            }
            syncData()
            if(!isServerReachable){
                const offline = async() =>{
                    await loadDaysLeft();
                    await showAlert();
                }
                offline()
            }
        }, []);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.titleContainer} >
                <ThemedText type="subtitle" >Welcome,</ThemedText>
                <ThemedText type="title">{username}</ThemedText>
            </View>
            <View style={styles.stepContainer}>
                <ThemedText type="subtitle">Step 1: Try it</ThemedText>

            </View>
        </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        padding: 30,
        backgroundColor: theme.colors.darkBackground,
        flex: 1,
    },
    titleContainer: {
        flexDirection: 'column',
        gap: 8,
        marginBottom: 20,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    button: {
        fontSize: 20,
        textDecorationLine: 'underline',
    },
});
