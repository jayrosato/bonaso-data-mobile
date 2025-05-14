import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function Layout() {
        return (
            <Tabs screenOptions={{tabBarActiveTintColor: '#156736'}}>
                <Tabs.Screen name="index" options ={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
                    )}}
                />
                <Tabs.Screen name="forms" options ={{
                        title: 'Forms',
                        tabBarIcon: ({ color, focused }) => (
                            <FontAwesome6 name="wpforms" size={24} color={color} />
                    )}}
                />

                <Tabs.Screen name="+not-found" options={{ href: null }} />
            </Tabs>
    );
}