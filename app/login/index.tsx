import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
import { getSecureItem, saveSecureItem } from '@/services/secure-storage-functions';
import bcrypt from "bcryptjs";
import * as ExpoCrypto from 'expo-crypto';
import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Button, ScrollView, StyleSheet, TextInput } from 'react-native';

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
            console.error('Offline credentials corrupted: ', err)
        }
    }
    else{
        console.warn('Offline login not available.')
        return false
    }
}
export default function Login(){
    const [response, setResponse] = useState('')
    const { signIn, offlineSignIn, isAuthenticated } = useAuth();
    const { isConnected, isServerReachable } = useConnection();
    const router = useRouter();
    
    const onSubmit = async (data) => {
        const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
        const username = data.username
        const password = data.password
        if(isServerReachable){
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
                    'access_level': loginResponse.access_level
                }
                await saveSecureItem('user_credentials', JSON.stringify(offlineCredentials))
                console.log('Offline login now available!')
                router.replace('/authorized/tabs');
            }   
            catch(err){
                console.error('Failed to log in: ', err)
            }
        }
        else{
            const checkCred = await offlineLogin(username, password)
            if(checkCred){
                const userSessionId = randomUUID();
                await offlineSignIn(userSessionId);
                console.log('redirecting')
                router.replace('/authorized/tabs');
            }
        }
    }

    const methods = useForm();
    const { control, handleSubmit, formState: { errors } } = methods;

    return(
        <FormProvider {...methods}>
            <ScrollView style={styles.container}>
                <ThemedText type="defaultSemiBold">Username</ThemedText>
                <Controller control={control} rules={{ required: true, maxLength: 255 }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder="username"
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
                        placeholder="password"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={true}
                    />
                    )}
                    name="password"
                />
                {errors.password && <ThemedText style={styles.errorText}>This field is required!</ThemedText>}

                <Button title="Submit" onPress={methods.handleSubmit(onSubmit)} />

                {response && <ThemedText> {response}</ThemedText>}
            </ScrollView>
        </FormProvider>
    )
}

const styles = StyleSheet.create({
    options: {
        flexDirection: 'row'
    },
  container: {
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});