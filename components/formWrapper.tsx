import { View } from 'react-native';
export default function FormWrapper({ children }) {

  return (
            <View style={{ padding: 20 }}>
                {children}
            </View>
    );
}