import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getSecureItem } from '@/services/secure-storage-functions';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
export default function OfflineInfo() {
    const router = useRouter();
    function goHome(){
        router.push({pathname: '/authorized/tabs'})
    }

    const [daysLeft, setDaysLeft] = useState(0)

    useEffect(() => {
        const loadDaysLeft = async () =>{
            const storedCredentials = await getSecureItem('user_credentials')
            if(storedCredentials){
                const cred = JSON.parse(storedCredentials)
                const now = new Date();
                const createdOn = new Date(cred.created_on);
                const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
                const expiresOn = new Date(createdOn.getTime() + THIRTY_DAYS_MS);
                const daysLeft = Math.ceil((expiresOn - now) / (1000 * 60 * 60 * 24));
                setDaysLeft(daysLeft);
            }
        }
        loadDaysLeft()
    }, [])

  return (
    <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
        <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
        />
        }>
        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Information about being offline.</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <ThemedText>
                We couldn't establish a connection to the server. Don't worry, you can still use the app. Just 
                a few things to keep in mind:
            </ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <ThemedText type="defaultSemiBold">You will not have the latest information.</ThemedText>
            <ThemedText>
                Any information you see in the app was downloaded the last time you were online, so certain
                information (forms, questions, and the like) may not be up to date. 
            </ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <ThemedText type="defaultSemiBold">You will not be able to upload information.</ThemedText>
            <ThemedText>
                Any information you collect on the app will not be uploaded to the server. But don't worry,
                it will automatically upload the next time you connect.
            </ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <ThemedText type="defaultSemiBold">Your login will expire.</ThemedText>
            <ThemedText>
                (As you probably know) you can log in while offline, but your credentials will expire in 
                30 days. Meaning that 30 days from the last time you logged in online, you will be
                unable to access the app again. So make sure you connect to the internet before then.
            </ThemedText>
            <ThemedText>
                Your login will expire in {daysLeft} days. Be sure to connect to the internet and log in 
                before then.
            </ThemedText>
            <ThemedView style={styles.stepContainer}>
            <ThemedText type="defaultSemiBold">Why is this happening?</ThemedText>
            <ThemedText>
                You may not be connected to the internet. Double check that your internet/data is on
                and you have a valid data package. If you are online (and you're able to do other things
                online, like search the web) then the issue is on our side. Our server might be down
                for maintnance or we may be having technical difficulties. If you would like more 
                information about our server status, or if you are seeing this message often,
                 please contact your supervisor. 
            </ThemedText>
        </ThemedView>
        </ThemedView>
        <Button title="Got it!" onPress={() => goHome()}></Button>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
