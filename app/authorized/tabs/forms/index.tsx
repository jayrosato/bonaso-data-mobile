import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useConnection } from '@/context/ConnectionContext';
import { getSecureItem } from '@/services/secure-storage-functions';
import { loadLocalForms } from '@/sync-load-queries/load-local-forms';
import { syncForms } from '@/sync-load-queries/sync-forms';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, } from 'react';
import { Button, StyleSheet } from 'react-native';
import initDatabase from '../../../database/initDB';
export default function FormIndex(){
    const router = useRouter();
    const { isConnected, isServerReachable } = useConnection();

    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initForms = async () => {
            await initDatabase();
            if(isServerReachable){
                const storedCredentials = await getSecureItem('user_credentials')
                if(storedCredentials){
                    const cred = JSON.parse(storedCredentials)
                    const userID = cred.user_id
                    await syncForms(userID);
                }
            }
            const localForms = await loadLocalForms();
            console.log(localForms)
            setForms(localForms);
            setLoading(false)
        }
        initForms()
    }, []);

    function goToForm(form){
        router.push({
            pathname: 'authorized/tabs/forms/[id]',
            params: { id: form.id }

        })
    }
    function goToResponse(form){
        router.push({
            pathname: 'authorized/tabs/forms/response/[id]',
            params: { id: form.id }

        })
    }
    
    function Forms(){
        if (loading) return <ThemedText>Loading...</ThemedText>;
        if (!forms || forms.length === 0) return <ThemedText>No forms yet!</ThemedText>;
        if(forms.length > 0){
            return(
                <ThemedView>
                    {forms.map((form) => (
                        <ThemedView key={form.id} style={styles.stepContainer}>
                                <ThemedText type="subtitle">{form.form_name}</ThemedText>
                                <ThemedText type="defaultSemiBold">From {form.organization_name}</ThemedText>
                                <ThemedText>Open from {form.start_date} to {form.end_date}</ThemedText>
                            <Button title="View Form" onPress={() => goToForm(form)}/>
                            <Button title="New Response" onPress={() => goToResponse(form)}/>
                        </ThemedView>
                    ))}
                </ThemedView>
            )
        }
    }


    return(
        <ParallaxScrollView
            headerBackgroundColor = {{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                    style={styles.reactLogo}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Your Forms</ThemedText>
            </ThemedView>
            <ThemedView>
                <Forms />
            </ThemedView>
        </ParallaxScrollView>
    )
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
});