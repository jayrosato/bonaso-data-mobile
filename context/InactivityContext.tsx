import { createContext, useContext, useEffect, useRef } from "react";
import { AppState, Keyboard, TouchableWithoutFeedback } from "react-native";

const InactivityContext = createContext();

export const InactivityProvider = ({ children, onTimeout, timeout=300000}) => {
    const timer = useRef(null);
    const appState = useRef(AppState.currentState);

    const resetTimer = () => {
        if(timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            console.log('Five minutes of inactivity, logging out.');
            onTimeout?.();
        }, timeout);
    };

    const handleAppStateChange = (nextAppState) => {
        if(appState.current.match(/inactive|background/) && nextAppState === 'active'){
            resetTimer();
        }
        appState.current = nextAppState;
    };
     const handleTouch = () => {
        resetTimer();
        Keyboard.dismiss();
     };

     useEffect(() => {
        console.log(AppState)
        AppState.addEventListener('change', handleAppStateChange);
        resetTimer();

        return () => {
            clearTimeout(timer.current);
        };
     }, [])

     return (
        <TouchableWithoutFeedback onPress={handleTouch}>
            {children}
        </TouchableWithoutFeedback>
    );
};
export const useInactivity = () => useContext(InactivityContext);
