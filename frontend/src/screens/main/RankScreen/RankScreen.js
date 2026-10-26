import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../../api/apiClient';
import { formatArabicPoints } from '../../../utils/formatArabicPoints';
import styles from './styles';

const roleBadges = {
    owner: { label: 'مالك', style: styles.ownerRoleBadge },
    admin: { label: 'مرشد', style: styles.adminRoleBadge },
    user: { label: 'مستخدم', style: styles.userRoleBadge },
};

export default function RankScreen() {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [currentUser, setCurrentUser] = useState({ name: '', points: 0, rank: 0, role: 'user' });
    const requestInFlight = useRef(false);

    const fetchRankings = useCallback(async (requestedPage, append = false) => {
        if (requestInFlight.current) return;
        requestInFlight.current = true;
        append ? setLoadingMore(true) : setLoading(true);
        setError('');

        try {
            // تم إصلاح الرابط هنا بإزالة /api المكررة
            const response = await api.get('/api/users/rank', {
                params: { page: requestedPage, limit: 20 },
            });
            const result = response.data?.data ?? response.data ?? {};
            const nextUsers = Array.isArray(result.users) ? result.users : [];

            setUsers((existingUsers) => append ? [...existingUsers, ...nextUsers] : nextUsers);
            if (result.currentUser) setCurrentUser(result.currentUser);
            setPage(requestedPage);
            setHasMore(result.hasMore === true);
        } catch (requestError) {
    console.log('--- DEBUG INFO ---');
    console.log('Target URL:', requestError.config?.url);
    console.log('Base URL:', requestError.config?.baseURL);
    console.log('Full URL:', (requestError.config?.baseURL || '') + (requestError.config?.url || ''));
    console.log('Server Message:', requestError.response?.data?.message);
    console.error('Failed to fetch rankings:', requestError);
            setError(requestError.response?.data?.message || 'تعذر تحميل قائمة الترتيب. تحقق من اتصالك ثم أعد المحاولة.');
            if (!append) {
                setUsers([]);
                setCurrentUser({ name: '', points: 0, rank: 0, role: 'user' });
                setHasMore(false);
            }
        } finally {
            requestInFlight.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchRankings(1);
    }, [fetchRankings]);

    const loadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            fetchRankings(page + 1, true);
        }
    };

    const retry = () => {
        const append = users.length > 0;
        fetchRankings(append ? page + 1 : 1, append);
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return 'trophy';
        if (rank === 2) return 'medal';
        if (rank === 3) return 'award';
        return 'star';
    };

    const getRankColor = (rank) => {
        if (rank === 1) return '#FFD700';
        if (rank === 2) return '#C0C0C0';
        if (rank === 3) return '#CD7F32';
        return '#348cb2';
    };

    const renderItem = ({ item }) => (
        <View style={[styles.rankCard, item.isCurrentUser && styles.currentUserCard]}>
        <View style={styles.rankInfo}>
            <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.rank) }]}>
            <FontAwesome5 name={getRankIcon(item.rank)} size={16} color="white" />
            <Text style={styles.rankNumber}>#{item.rank}</Text>
            </View>
            <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                    <Text style={[styles.userName, item.isCurrentUser && styles.currentUserName]}>{item.name}</Text>
                    {roleBadges[item.role] && (item.role !== 'user' || ['admin', 'owner'].includes(currentUser.role)) && (
                        <View style={[styles.roleBadge, roleBadges[item.role].style]}>
                            <Text style={styles.roleBadgeText}>{roleBadges[item.role].label}</Text>
                        </View>
                    )}
                </View>
                {item.isCurrentUser && <Text style={styles.currentUserLabel}>(أنت)</Text>}
            </View>
        </View>
        <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>
                {item.points.toLocaleString('en-US')}
            </Text>
        </View>
        </View>
    );

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>ترتيبي</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>رجوع</Text>
                <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
                </TouchableOpacity>
            </View>

            <View style={styles.currentRankCard}>
                <Text style={styles.currentRankLabel}>ترتيبك الحالي</Text>
                <View style={styles.currentRankInfo}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(currentUser.rank) }]}>
                    <FontAwesome5 name={getRankIcon(currentUser.rank)} size={20} color="white" />
                    <Text style={styles.currentRankNumber}>#{currentUser.rank}</Text>
                </View>
                <View style={styles.currentUserDetails}>
                    <Text style={styles.currentUserName}>{currentUser.name}</Text>
                    <Text style={styles.currentUserPoints}>
                        {formatArabicPoints(currentUser.points)}
                    </Text>
                </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>ترتيب الأصدقاء</Text>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#348cb2" />
                </View>
            ) : error && users.length === 0 ? (
                <View style={styles.errorState} accessibilityRole="alert">
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retry} accessibilityRole="button">
                        <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? (
                        <ActivityIndicator size="small" color="#348cb2" />
                    ) : error ? (
                        <View style={styles.errorFooter} accessibilityRole="alert">
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={retry} accessibilityRole="button">
                                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    ListFooterComponentStyle={{ paddingVertical: 16, alignItems: 'center' }}
                    ListEmptyComponent={<Text style={styles.emptyText}>لا يوجد مستخدمون في قائمة الترتيب حتى الآن.</Text>}
                />
            )}
        </View>
    );
}