import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    // Settings Styles
    settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
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
    },
    modalHeader: {
        flexDirection: 'row',
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
    },
    modalBody: {
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
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
        marginLeft: 15,
        flex: 1,
    },
    pointsValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#348cb2',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    rankValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f39c12',
        backgroundColor: '#fef5e7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    logoutItem: {
        backgroundColor: '#ffebee',
    },
    logoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#e74c3c',
        marginLeft: 15,
        flex: 1,
    }
});

export default styles;