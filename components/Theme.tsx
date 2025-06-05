import theme from '@/themes/theme.js';
import { StyleSheet, View } from 'react-native';

const Theme = ({ children}) => {
    return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.darkBackground,
        color: theme.colors.lightText,
    }
});

export default Theme;