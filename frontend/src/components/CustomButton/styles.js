import { Platform, StyleSheet } from "react-native";
import { webTextAlignRight } from '../../utils/webRtlStyles'

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: 300,
        bottom: '50%',
        left: '50%',
        transform: [{ translateY: '50%' }, { translateX: '-50%' }],
        zIndex: 2,
        flexDirection: 'row',
        ...Platform.select({ web: { flexDirection: 'row-reverse' }, default: {} }),
        flexWrap: 'wrap',
        gap: 20,
        paddingHorizontal: 15,
        marginTop: 25
    },

    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonCompleted: {
        backgroundColor: 'rgba(135, 206, 235, 0.33)',
        borderColor: 'rgba(135, 206, 235, 0.33)',
    },

    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },

    banIcon: {
        position: 'absolute',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    modalContent: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 14,
    },

    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },

    modalMessageBold: {
        fontWeight: 'bold',
    },

    modalActions: {
        width: '100%',
        flexDirection: 'row',
        ...Platform.select({ web: { flexDirection: 'row-reverse' }, default: {} }),
        justifyContent: 'space-between',
    },

    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },

    cancelButton: {
        backgroundColor: '#ef5350',
    },

    confirmButton: {
        backgroundColor: '#4caf50',
    },

    modalButtonText: {
        color: '#fff',
        fontWeight: '700',
        ...webTextAlignRight,
    }
});

export default styles;