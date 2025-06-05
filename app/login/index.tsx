import LoadingScreen from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
import { deleteSecureItem, getSecureItem, saveSecureItem } from '@/services/secure-storage-functions';
import theme from '@/themes/theme';
import bcrypt from "bcryptjs";
import * as ExpoCrypto from 'expo-crypto';
import { randomUUID } from 'expo-crypto';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from "react-hook-form";
import { StyleSheet, TextInput, View } from 'react-native';

// Fallback random generator for bcryptjs
bcrypt.setRandomFallback((len) => {
    const randomBytes = ExpoCrypto.getRandomBytes(len);
    return Array.from(randomBytes); // bcryptjs expects an array of integers
});

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

async function offlineLogin(username, password){
    const storedCredentials = await getSecureItem('user_credentials')
    if(storedCredentials){
        try{
            const cred = JSON.parse(storedCredentials)
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const now = new Date();
            const createdOn = new Date(cred.created_on);

            if (now - createdOn > THIRTY_DAYS_MS) {
                console.warn('Offline credentials expired. You must connect to the internet to log in.')
                return false
            }
            if(username === cred.username){
                const match = await bcrypt.compare(password, cred.password);
                if(match){
                    console.log('credentials met')
                    return match
                }
                else{
                    console.log('Incorrect password.')
                    return false
                }
            }
            else{
                console.log('Incorrect login info.')
                return false
            }
        }
        catch(err){
            await deleteSecureItem('user_credentials');
            console.error('Offline credentials corrupted: ', err)
        }
    }
    else{
        console.warn('Offline login not available.')
        return false
    }
}
export default function Login(){
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('')
    const { signIn, offlineSignIn, isAuthenticated } = useAuth();
    const { isConnected, isServerReachable } = useConnection();
    const router = useRouter();
    const today = new Date();
    const onSubmit = async (data) => {
        console.log(isServerReachable);
        const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
        const username = data.username
        const password = data.password
        if(isServerReachable){
            setLoading(true);
            try{
                console.log('hacking the mainframe: ', data)
                const response = await fetch(`http://${dn}/account/api/token/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 'username':username, 'password':password }),
                })
                const loginResponse = await response.json();
                console.log(loginResponse)
                await signIn(loginResponse)

                const hashed = await hashPassword(password)
                const offlineCredentials = {
                    'username': username,
                    'password': hashed,
                    'access_level': loginResponse.access_level,
                    'user_id': loginResponse.user_id,
                    'created_on': today.toISOString()
                }
                await saveSecureItem('user_credentials', JSON.stringify(offlineCredentials))
                console.log('Offline login now available!')
                setLoading(false);
                router.replace('/authorized/tabs');
            }   
            catch(err){
                console.error('Failed to log in: ', err)
            }
        }
        else{
            setLoading(true);
            const checkCred = await offlineLogin(username, password)
            if(checkCred){
                console.log('Found offline credentials...')
                const userSessionId = randomUUID();
                await offlineSignIn(userSessionId);
                console.log('redirecting')
                setLoading(false);
                router.replace('/authorized/tabs');
            }
        }
    }

    const methods = useForm();
    const { control, handleSubmit, formState: { errors } } = methods;
    if(loading){return <LoadingScreen />}
    return(
        <View style={styles.loginPage}>
        <FormProvider {...methods}>
            <Image style={styles.loginImg} source={require('../../assets/images/boansoWhite.png')} />
            <View style={styles.loginContainer}>
                <ThemedText type="title" style={styles.title}>Welcome Back!</ThemedText>
                <ThemedText type="defaultSemiBold">Username</ThemedText>
                <Controller control={control} rules={{ required: true, maxLength: 255 }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Type your username here..."
                        placeholderTextColor={theme.colors.lightGrey}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                    />
                    )}
                    name="username"
                />
                {errors.username && <ThemedText style={styles.errorText}>This field is required!</ThemedText>}

                <ThemedText type="defaultSemiBold" >Password</ThemedText>
                <Controller control={control} rules={{ required: true, maxLength: 255 }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password here..."
                        placeholderTextColor={theme.colors.lightGrey}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={true}
                    />
                    )}
                    name="password"
                />
                {errors.password && <ThemedText style={styles.errorText}>This field is required!</ThemedText>}

                <ThemedButton text="Submit" onPress={handleSubmit(onSubmit)} />
                {response && <ThemedText> {response}</ThemedText>}
            </View>
        </FormProvider>
        </View>
    )
}

const styles = StyleSheet.create({
    loginPage: {
        backgroundColor: theme.colors.darkBackground,
    },
    loginImg:{
        position: 'absolute',
        height: 200,
        width: 200,
        top: 100,
        left: 100,
    },
    title:{
        textAlign: 'center',
        height: 50,
        marginBottom: 10,
    },
    loginContainer: {
        backgroundColor: theme.colors.darkBackground,
        display: 'flex',
        flexDirection: 'column',
        top: 350,
        margin: 40,
    },
    input: {
        marginTop: 7,
        color: 'white',
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        padding: 8,
    },
    errorText: {
        padding: 2,
        borderWidth: 4,
        borderStyle: 'solid',
        borderColor: 'darkred',
        backgroundColor: 'lightcoral',
        color: 'red',
        marginBottom: 10,
    },
});