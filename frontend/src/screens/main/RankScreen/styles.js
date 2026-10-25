import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f8ff',
        direction: 'rtl',
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
        marginEnd: 8,
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
        textAlign: 'left',
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
        marginEnd: 15,
    },
    currentRankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    currentUserDetails: {
        flex: 1,
        alignItems: 'flex-start',
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
        fontFamily: 'sans-serif',
        textAlign: 'right',
    },
    sectionTitle: {
        marginHorizontal: 20,
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '700',
        color: '#213a71',
        textAlign: 'left',
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
        marginStart: 15,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#162d50',
        textAlign: 'right',
    },
    currentUserName: {
        color: '#348cb2',
    },
    currentUserLabel: {
        fontSize: 14,
        color: '#348cb2',
        fontWeight: '600',
    },
    roleBadge: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    ownerRoleBadge: {
        backgroundColor: '#fff1c2',
    },
    adminRoleBadge: {
        backgroundColor: '#dbeafe',
    },
    userRoleBadge: {
        backgroundColor: '#e5e7eb',
    },
    pointsContainer: {
        alignItems: 'flex-start',
    },
    pointsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#348cb2',
        fontFamily: 'sans-serif',
        textAlign: 'left',
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorFooter: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    errorText: {
        color: '#9f2d20',
        textAlign: 'center',
        lineHeight: 24,
    },
    retryButton: {
        marginTop: 12,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#348cb2',
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    emptyText: {
        paddingVertical: 28,
        textAlign: 'center',
        color: '#6f7f96',
    },
});

export default styles;
