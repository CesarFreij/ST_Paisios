import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineBanner() {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-56)).current;
    const [isConnected, setIsConnected] = useState(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const offline = state.isConnected === false;
            setIsConnected(state.isConnected);
            Animated.timing(translateY, {
                toValue: offline ? 0 : -56,
                duration: 220,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        });

        return unsubscribe;
    }, [translateY]);

    if (isConnected !== false) {
        return null;
    }

    return (
        <Animated.View
            accessibilityRole="alert"
            accessibilityElementsHidden={false}
            importantForAccessibility="yes"
            style={[
                styles.banner,
                { top: insets.top, transform: [{ translateY }] },
            ]}
        >
            <Text style={styles.text}>أنت غير متصل بالإنترنت</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        start: 12,
        end: 12,
        zIndex: 1000,
        elevation: 20,
        pointerEvents: 'none',
        borderRadius: 10,
        backgroundColor: '#b42318',
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
