import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingScreen(){
    return(
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007aff" />
            <Text style={{ marginTop: 10 }}>Loading...</Text>
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