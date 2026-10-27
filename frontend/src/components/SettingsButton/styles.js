import { Platform, StyleSheet } from "react-native";
import { webTextAlignRight } from '../../utils/webRtlStyles'

const styles = StyleSheet.create({
    // Settings Styles
    settingsButton: {
    position: 'absolute',
    top: 0,
    end: 0,
    zIndex: 10,
    padding: 20,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '70%',
        ...Platform.select({ web: { width: '100%', alignSelf: 'stretch' }, default: {} }),
    },
    modalHeader: {
        flexDirection: 'row',
        ...Platform.select({ web: { flexDirection: 'row', gap: 8 }, default: {} }),
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#348cb2',
        textAlign: 'center',
        flex: 1,
        ...Platform.select({ web: { textAlign: 'right' }, default: {} }),
    },
    modalBody: {
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row-reverse',
        ...Platform.select({ web: { flexDirection: 'row', gap: 8 }, default: {} }),
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        marginBottom: 12,
    },
    menuItemText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginRight: 15,
        ...Platform.select({ web: { marginRight: 0 }, default: {} }),
        flex: 1,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    menuSummary: {
        maxWidth: '36%',
        minWidth: 76,
        alignItems: 'flex-start',
        justifyContent: 'center',
        ...Platform.select({ web: { alignItems: 'flex-end', justifyContent: 'center' }, default: {} }),
    },
    pointsValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#348cb2',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        maxWidth: '100%',
        textAlign: 'left',
        writingDirection: 'rtl',
        ...Platform.select({ web: { textAlign: 'right' }, default: {} }),
    },
    logoutItem: {
        backgroundColor: '#ffebee',
    },
    logoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#e74c3c',
        marginRight: 15,
        ...Platform.select({ web: { marginRight: 0 }, default: {} }),
        ...webTextAlignRight,
    }
});

export default styles;