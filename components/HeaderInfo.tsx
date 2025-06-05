import { useAuth } from "@/context/AuthContext";
import theme from "@/themes/theme";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { StyleSheet, View } from "react-native";
import ThemedButton from "./ThemedButton";
import { ThemedText } from "./ThemedText";
export default function HeaderInfo({ username, connected }) {
    const { signOut } = useAuth();
    return(
        <View style={styles.header}>
                <ThemedText style={styles.user} type="defaultSemiBold" numberOfLines={1} ellipsizeMode="tail">{username}</ThemedText>
                <MaterialIcons style={styles.connected} name={connected ? 'wifi' : 'wifi-off' } size={20} color={theme.colors.lightBackground} />
            <ThemedButton text={"Log Out"} onPress={() => signOut()} style={styles.button} />
        </View>
    )
}

const styles = StyleSheet.create({
    header:{
        padding: 20,
        backgroundColor: theme.colors.darkAccent,
        flexDirection: 'row',
        height: 80,
    },
    connected:{
        left: 7,
        top: 20,
    },
    user:{
        flexShrink: 1,
        maxWidth: 225,
        top: 20,
    },
    button: {
        position: 'absolute',
        left: 310,
        top:30,
        width: 80,
        height: 38,
    }
})