import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from "react";
import { deleteSecureItem, saveSecureItem } from '../services/secure-storage-functions';

type AuthContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    userToken: string | null;
    username: string | null;
    signIn: (data: JSON) => Promise<void>;
    signOut: () => Promise<void>;
    offlineSignIn: (token:string) => Promise<void>;
};

const AuthContext= createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) =>{
    const [userToken, setUserToken] = useState<string | null>(null);
    const[isLoading, setIsLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false)
    useEffect(() => {
        const loadToken = async () => {
            const token = await SecureStore.getItemAsync('userToken');
            setUserToken(token);
            setIsLoading(false);
        };
        loadToken();
    }, []);

    const signIn = async (data:JSON) => {
        const token = data.access;
        const username = data.username;
        const access_level = data.access_level
        await saveSecureItem('userToken', token)
        await saveSecureItem('username', username)
        await saveSecureItem('access_level', access_level)
        setUserToken(token);
        setAuthenticated(true);
        console.log('Signed In');
    }
    const offlineSignIn = async (token:string) => {
        await saveSecureItem('userToken', token)
        setUserToken(token)
        setAuthenticated(true);
        console.log('Signed In');
    }
    const signOut = async(token:string) => {
        await deleteSecureItem('userToken');
        await deleteSecureItem('username');
        await deleteSecureItem('access_level');
        setAuthenticated(false);
        setUserToken(null);
        console.log('Signed Out');
        router.replace('/login');
    }
    return(
        <AuthContext.Provider value={{
            isAuthenticated: !!userToken,
            isLoading,
            userToken,
            signIn,
            offlineSignIn,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth requires AuthProvider')
    }
    return context
}