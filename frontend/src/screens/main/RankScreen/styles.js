import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f8ff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#348cb2',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0b3d91',
    },
    currentRankCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    currentRankLabel: {
        fontSize: 16,
        color: '#6f7f96',
        marginBottom: 15,
    },
    currentRankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    currentRankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    currentUserDetails: {
        flex: 1,
    },
    currentUserName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1d4f91',
        marginBottom: 5,
    },
    currentUserPoints: {
        fontSize: 18,
        fontWeight: '600',
        color: '#348cb2',
    },
    sectionTitle: {
        marginHorizontal: 20,
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '700',
        color: '#213a71',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    currentUserCard: {
        borderWidth: 2,
        borderColor: '#348cb2',
        backgroundColor: '#f0f8ff',
    },
    rankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 2,
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#162d50',
    },
    currentUserName: {
        color: '#348cb2',
    },
    currentUserLabel: {
        fontSize: 14,
        color: '#348cb2',
        fontWeight: '600',
    },
    pointsContainer: {
        alignItems: 'flex-end',
    },
    pointsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#348cb2',
    },
});

export default styles;
