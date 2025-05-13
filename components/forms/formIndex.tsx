import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import initDatabase from '../../app/database/initDB';
import { loadLocalForms, syncForms } from '../../app/database/queryWriter';

export default function GetForms(){
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initForms = async () => {
            await initDatabase();
            await syncForms();
            const localForms = await loadLocalForms();
            console.log(localForms)
            setForms(localForms);
            setLoading(false)
        }
        initForms()
    }, []);

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