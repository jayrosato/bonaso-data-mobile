import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect } from 'react';
import initDatabase from '../../database/initDB';
import { cleanLocalStorage, syncResponses } from '../../database/queryWriter';
export default function HomeScreen() {
    useEffect(() => {
            const syncData = async () => {
                await initDatabase();
                await syncResponses();
                await cleanLocalStorage();
            }
            syncData()
        }, []);
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
            <ThemedText type="title">Welcome!</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Step 1: Try it</ThemedText>
                <ThemedText>
                    Edit this to see changes.
                    Press{' '}
                    <ThemedText type="defaultSemiBold">
                        {Platform.select({
                            ios: 'cmd + d',
                            android: 'cmd + m',
                            web: 'F12',
                        })}
                    </ThemedText>{' '}
                    to open developer tools.
            </ThemedText>
        </ThemedView>
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
