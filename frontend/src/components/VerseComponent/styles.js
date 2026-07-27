import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: 'rgba(255, 165, 0, 0.30)',
        borderRadius: 20,
        alignItems: 'center',
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 2,
    },

    verseText: {
        fontSize: 25,
        textAlign: 'center',
        color: 'white',
        lineHeight: 28,
    },
});

export default styles;