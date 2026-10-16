import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: 'rgba(255, 165, 0, 0.30)',
        borderRadius: 20,
        alignItems: 'center',
        position: 'absolute',
        top: 50,
        start: 20,
        end: 20,
        zIndex: 2,
    },

    verseText: {
        fontSize: 25,
        textAlign: 'center',
        color: 'white',
        lineHeight: 28,
        writingDirection: 'rtl',
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 10,
    },
    retryText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});

export default styles;