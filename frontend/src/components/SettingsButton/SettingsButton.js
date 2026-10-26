import { ActivityIndicator, View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons';
import styles from './styles';
import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import authService from '../../services/authService';
import api from '../../api/apiClient';
import { useUserPoints } from '../../context/UserPointsContext';
import {
    defaultRewardMilestones,
    getCurrentRewardMilestone,
} from '../../utils/rewardMilestones';

export default function ModalScreen() {
    const { setUser } = useUserPoints();
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const navigation = useNavigation();

    const loadSettingsSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const [response, userResponse] = await Promise.all([
                api.get('/api/user/settings-summary'),
                api.get('/api/auth/me'),
            ]);
            const data = response?.data?.data;
            const currentUser = userResponse?.data?.data;
            if (currentUser) setUser(currentUser);
            const totalPoints = Number(currentUser?.totalPoints ?? 0);
            const rewardMilestones = Array.isArray(data?.rewardMilestones)
                ? data.rewardMilestones
                : defaultRewardMilestones;
            setSummary({
                totalPoints,
                rank: Number(data?.rank ?? 0),
                currentTitle: getCurrentRewardMilestone(
                    totalPoints,
                    rewardMilestones
                )?.name || 'مبتدئ',
                quizStatus: data?.quizStatus ?? '—',
            });
        } catch (error) {
            console.error('Failed to load settings summary:', {
                message: error instanceof Error ? error.message : String(error),
                baseURL: error?.config?.baseURL ?? api.defaults?.baseURL,
                url: error?.config?.url ?? '/api/user/settings-summary',
                responseData: error?.response?.data,
            });
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, [setUser]);

    useFocusEffect(
        useCallback(() => {
            loadSettingsSummary();
            return undefined;
        }, [loadSettingsSummary])
    );

    const openSettings = () => {
        setSettingsVisible(true);
        loadSettingsSummary();
    };

    const openPoints = () => {
        setSettingsVisible(false);
        navigation.navigate('Points');
    };

    const openRank = () => {
        setSettingsVisible(false);
        navigation.navigate('Rank');
    };

    const openWeeklyExam = () => {
        setSettingsVisible(false);
        navigation.navigate('WeeklyExam');
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setSettingsVisible(false);
            navigation.reset({
                index: 0,
                routes: [{ name: 'LoginRegister' }],
            });
        } catch (error) {
            console.error('Failed to clear authentication data:', error);
        }
    };

    return (
        <>
        {/* Settings Button */}
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={openSettings}
            >
                <FontAwesome5 name="align-justify" size={30} color="white" />
            </TouchableOpacity>
            {/* Modal Screen */}
            <Modal
                visible={settingsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSettingsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSettingsVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={() => {}}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>الإعدادات</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <FontAwesome5 name="times" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

<ScrollView style={styles.modalBody}>
                            {/* Points Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={openPoints}>
                                <FontAwesome5 name="star" size={20} color="#348cb2" />
                                <Text style={styles.menuItemText}>النقاط</Text>
                                <View style={styles.menuSummary}>
                                    {summaryLoading ? <ActivityIndicator size="small" color="#348cb2" /> : (
                                        <Text style={[styles.pointsValue, { color: '#348cb2', backgroundColor: '#348cb220' }]} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                                            {`${summary?.totalPoints ?? '—'} نقطة`}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Ranking Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={openRank}>
                                <FontAwesome5 name="trophy" size={20} color="#f39c12" />
                                <Text style={styles.menuItemText}>ترتيبي</Text>
                                <View style={styles.menuSummary}>
                                    {summaryLoading ? <ActivityIndicator size="small" color="#f39c12" /> : (
                                        <Text style={[styles.pointsValue, { color: '#f39c12', backgroundColor: '#f39c1220' }]} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                                            {summary ? `#${summary.rank}` : '—'}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Weekly exam Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={openWeeklyExam}>
                                <FontAwesome5 name="book" size={20} color="#2e86de" />
                                <Text style={styles.menuItemText}>الاختبارات الأسبوعية</Text>
                                <View style={styles.menuSummary}>
                                    {summaryLoading ? <ActivityIndicator size="small" color="#2e86de" /> : (
                                        <Text style={[styles.pointsValue, { color: '#2e86de', backgroundColor: '#2e86de20' }]} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                                            {summary?.quizStatus || '—'}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Achievements Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsVisible(false); navigation.navigate('Achievements'); }}>
                                <FontAwesome5 name="award" size={20} color="#9b59b6" />
                                <Text style={styles.menuItemText}>الإنجازات والألقاب</Text>
                                <View style={styles.menuSummary}>
                                    {summaryLoading ? <ActivityIndicator size="small" color="#9b59b6" /> : (
                                        <Text style={[styles.pointsValue, { color: '#9b59b6', backgroundColor: '#9b59b620' }]} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                                            {`${summary?.currentTitle || '—'}`}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Logout Option */}
                            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                                <FontAwesome5 name="sign-out-alt" size={20} color="#e74c3c" />
                                <Text style={styles.logoutText}>تسجيل الخروج</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    )
}
