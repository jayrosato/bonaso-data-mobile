import checkServerConnection from "@/services/checkServerConnection";
import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState } from "react";

const ConnectionContext = createContext({ isConnected: true, isServerReachable: true })

export const ConnectionTest = ({ children }) => {
    const[isConnected, setIsConnected] = useState(true);
    const[isServerReachable, setIsServerReachable] = useState(true)
    useEffect(() => {
        const interval = setInterval(async () => {
            console.log('Checking connection...')
            const state = await NetInfo.fetch();
            setIsConnected(!!state.isConnected);
            if(isConnected){
                const serverResponse = await checkServerConnection();
                setIsServerReachable(serverResponse);
            }
        }, 60000);
        
        return () => clearInterval(interval);
    }, [isConnected])

    return (
        <ConnectionContext.Provider value={{ isConnected, isServerReachable }}>
            {children}
        </ConnectionContext.Provider>
    )
}

export const useConnection = () => useContext(ConnectionContext);