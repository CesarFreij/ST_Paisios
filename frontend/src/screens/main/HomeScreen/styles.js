import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        direction: 'ltr',
        backgroundColor: '#348cb2',
    },
    icon: {
        'width': '100%',
        'height': '100%',
        opacity: 0.6,
        zIndex: 1,
    },
    mountain: {
        'width': '100%',
        'height': '33%',
        position: 'absolute',
        bottom: 0,
        start: 0,
    },
    text: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        top: '35%',
        left: '50%',
        transform: [{ translateY: '-50%' }, { translateX: '-50%' }],
        zIndex: 2,
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    homeUserSummary: {
        position: 'absolute',
        top: '30%',
        left: 16,
        right: 16,
        zIndex: 2,
        alignItems: 'center',
    },
    sheetButton: {
        marginTop: 16,
        backgroundColor: '#0b3d91',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    sheetButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    dailyModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dailyModalCard: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    dailyModalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0b3d91',
        marginBottom: 16,
        textAlign: 'center',
    },
    dailyQuestionText: {
        fontSize: 18,
        color: '#213a71',
        marginBottom: 18,
        lineHeight: 26,
        textAlign: 'right',
    },
    dailyAnswerOption: {
        backgroundColor: '#f5f7fb',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    dailyAnswerText: {
        fontSize: 16,
        color: '#213a71',
        textAlign: 'right',
    },
    dailyResultBox: {
        marginTop: 18,
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
    },
    dailyResultSuccess: {
        backgroundColor: '#e8f7f5',
    },
    dailyResultError: {
        backgroundColor: '#fdecea',
    },
    dailyResultText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1d4f91',
        marginBottom: 6,
    },
    dailyResultSubText: {
        fontSize: 16,
        color: '#63738f',
        textAlign: 'center',
    },
    snackbar: {
        position: 'absolute',
        top: 24,
        left: 20,
        right: 20,
        zIndex: 20,
        elevation: 12,
        borderRadius: 14,
        paddingVertical: 15,
        paddingHorizontal: 18,
    },
    snackbarSuccess: {
        backgroundColor: '#2e7d32',
    },
    snackbarWarning: {
        backgroundColor: '#C62828',
    },
    snackbarError: {
        backgroundColor: '#B71C1C',
    },
    snackbarCelebration: {
        backgroundColor: '#8A5A00',
        borderWidth: 1,
        borderColor: '#FFD54F',
    },
    snackbarText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default styles;