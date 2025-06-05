import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

export default function LoadingScreen(){
    return(
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#fffff" />
            <ThemedText style={{ marginTop: 10 }}>Loading...</ThemedText>
        </View>
    );
    
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});