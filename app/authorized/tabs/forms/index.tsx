import LoadingScreen from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useConnection } from '@/context/ConnectionContext';
import { getSecureItem } from '@/services/secure-storage-functions';
import { loadLocalForms } from '@/sync-load-queries/load-local-forms';
import { syncForms } from '@/sync-load-queries/sync-forms';
import theme from '@/themes/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState, } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
        if (!forms || forms.length === 0) return <ThemedText>No forms yet!</ThemedText>;
        if(forms.length > 0){
            return(
                <View>
                    {forms.map((form) => (
                        <View key={form.id} style={styles.formContainer}>
                            <ThemedText type="subtitle">{form.form_name}</ThemedText>
                            <ThemedText type="defaultSemiBold">From {form.organization_name}</ThemedText>
                            <ThemedText>Open from {form.start_date} to {form.end_date}</ThemedText>
                            <View style={styles.actions}>
                                <ThemedButton text="New Response" onPress={() => goToResponse(form)} style={styles.respond} />
                                <ThemedButton text="View Details" onPress={() => goToForm(form)} style={styles.view}/>
                            </View>
                        </View>
                    ))}
                </View>
            )
        }
    }

    if(loading){ return <LoadingScreen /> }
    return(
        <ScrollView style={styles.container}>
            <View style={styles.titleContainer}>
                <ThemedText type="title">Your Forms</ThemedText>
            </View>
            <View>
                <Forms />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container:{
        padding: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 30,
    },
    formContainer: {
        borderRadius: 8,
        padding: 20,
        gap: 8,
        marginBottom: 8,
        backgroundColor: theme.colors.darkAccent
    },
    actions:{
        flexDirection:'row',
    },
    view:{
        width: 115,
        left: 20,
    },
    respond:{
        width: 200,
    }
});