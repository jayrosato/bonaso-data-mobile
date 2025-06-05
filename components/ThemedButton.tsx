import theme from "@/themes/theme";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function ThemedButton({ text, onPress, style=null } ) {
    return(
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <Text style={styles.buttonText}>{text}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button:{
        backgroundColor: theme.colors.lightBackground,
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText:{
        fontWeight: 'bold',
        fontSize: 17,
        color: theme.colors.darkText,
    }
})