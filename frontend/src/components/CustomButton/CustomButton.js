import { useCallback, useRef, useState } from 'react'
import { Alert, View, Text, Modal, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import styles from './styles'
import { FontAwesome5 } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import api from '../../api/apiClient';
import { formatArabicPoints } from '../../utils/formatArabicPoints';

const progressFieldByAction = {
    'الصلاة': 'prayerCount',
    'الكتاب المقدس': 'bibleCount',
    'الكنيسة': 'churchCount',
    'عمل الرحمة': 'goodDeedCount',
    'الصوم': 'fastingCount',
};

const actionLabelsByCounter = {
    prayerCount: 'الصلاة',
    fastingCount: 'الصوم',
    bibleCount: 'الكتاب المقدس',
    churchCount: 'الكنيسة',
    goodDeedCount: 'عمل الرحمة',
};

const normalizeActionPoints = (configuredPoints) => {
    if (!configuredPoints) {
        throw new Error('لم يتم استلام إعدادات النقاط من الخادم.');
    }
    const actionPoints = {
        prayer: configuredPoints.prayerPoints,
        fasting: configuredPoints.fastingPoints,
        bible: configuredPoints.dailyVersePoints ?? configuredPoints.biblePoints,
        church: configuredPoints.churchPoints,
        goodDeed: configuredPoints.goodDeedPoints,
    };
    if (Object.values(actionPoints).some((points) =>
        !Number.isSafeInteger(Number(points)) || Number(points) < 0
    )) {
        throw new Error('إعدادات النقاط المستلمة من الخادم غير صالحة.');
    }
    return Object.fromEntries(
        Object.entries(actionPoints).map(([action, points]) => [action, Number(points)])
    );
};

const getSyriaDate = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Damascus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
}).format(new Date());

const ButtonIcon = ({ name, size = 30, icon: Icon = FontAwesome5, onPress, completed, disabled }) => (
    <TouchableOpacity
        style={[styles.button, completed && styles.buttonCompleted]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
    >
        <Icon name={name} size={size} color="white" />
    </TouchableOpacity>
);

const HamburgerBanButton = ({ onPress, completed, disabled }) => (
    <TouchableOpacity
        style={[styles.button, completed && styles.buttonCompleted]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
    >
        <View style={styles.iconWrapper}>
            <FontAwesome5 name="hamburger" size={15} color="white" />
            <FontAwesome5 name="ban" size={30} color="white" style={styles.banIcon} />
        </View>
    </TouchableOpacity>
);

export default function CustomButton({
    onPointsAwarded,
    onOptimisticPointsChange,
    onSnackbar,
    onAchievementsUnlocked,
}) {
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState('');
    const [selectedPoints, setSelectedPoints] = useState(0);
    const [selectedCounter, setSelectedCounter] = useState(null);
    const requestInFlight = useRef(false);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [actionPoints, setActionPoints] = useState({});
    const [pointSettingsLoaded, setPointSettingsLoaded] = useState(false);
    const [completedActions, setCompletedActions] = useState({});

    useFocusEffect(
        useCallback(() => {
        let active = true;
        setPointSettingsLoaded(false);
        const today = getSyriaDate();
        api.get('/api/progress')
            .then((response) => {
                const lastActionDates = response.data?.data?.progress?.lastActionDates ?? {};
                if (active) {
                    setCompletedActions(Object.fromEntries(
                        Object.entries(lastActionDates).map(([counter, date]) => [counter, date === today])
                    ));
                }
            })
            .catch((error) => {
                if (active) {
                    console.error('Failed to load today’s action state:', error);
                }
            });

        api.get('/api/settings/points')
            .then((response) => {
                if (active) {
                    setActionPoints(normalizeActionPoints(response.data?.data));
                    setPointSettingsLoaded(true);
                }
            })
            .catch((error) => {
                if (active) {
                    console.error('Failed to load action points:', error);
                    Alert.alert(
                        'تعذر تحميل إعدادات النقاط',
                        error.response?.data?.message || error.message || 'تحقق من اتصال الشبكة ثم أعد المحاولة.'
                    );
                }
            });

        return () => {
            active = false;
        };
        }, []),
    );

    const openConfirm = (label, action) => {
        if (!pointSettingsLoaded) {
            Alert.alert('إعدادات النقاط غير جاهزة', 'أعد فتح الشاشة بعد تحميل إعدادات النقاط من الخادم.');
            return;
        }
        setSelectedTodo(label);
        setSelectedPoints(actionPoints[action] ?? 0);
        setSelectedCounter(progressFieldByAction[label] || null);
        setConfirmVisible(true);
    };

    const handleAddPoints = async () => {
        if (requestInFlight.current) return;
        if (!selectedCounter) {
            Alert.alert('تعذر حفظ التقدم', 'هذا النشاط غير مرتبط بحقل تقدم في الخادم.');
            return;
        }

        const counter = selectedCounter;
        const optimisticPoints = Number(selectedPoints) || 0;
        requestInFlight.current = true;
        setIsSubmittingAction(true);
        setConfirmVisible(false);
        setCompletedActions((current) => ({ ...current, [counter]: true }));
        onOptimisticPointsChange?.(optimisticPoints);

        try {
            const response = await api.post('/api/progress/action', {
                action: counter,
                expectedPoints: optimisticPoints,
            });

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'فشل حفظ التقدم.');
            }
            const baseActionPoints = Number(response.data?.data?.baseActionPoints);
            const awardedPoints = Number(response.data?.data?.awardedPoints);
            if (
                !Number.isSafeInteger(baseActionPoints) ||
                baseActionPoints !== optimisticPoints ||
                !Number.isSafeInteger(awardedPoints) ||
                awardedPoints < baseActionPoints
            ) {
                throw new Error('استجابة الخادم لا تحتوي على قيمة نقاط صالحة.');
            }
            onPointsAwarded?.(
                awardedPoints,
                response.data?.data?.totalPoints,
                optimisticPoints,
                undefined,
                response.data?.data?.maxPoints
            );
            const newlyUnlocked = response.data?.data?.newlyUnlocked;
            if (Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) {
                onAchievementsUnlocked?.(newlyUnlocked);
            }
            const perfectMonthAction = response.data?.data?.perfectMonthAction;
            if (response.data?.data?.perfectMonthAchieved === true) {
                const perfectMonthPoints = Number(response.data?.data?.perfectMonthPoints);
                const rewardMessage = Number.isSafeInteger(perfectMonthPoints) && perfectMonthPoints > 0
                    ? ` وحصلت على ${formatArabicPoints(perfectMonthPoints)} إضافية!`
                    : ' وحصلت على مكافأة إضافية!';
                onSnackbar?.(
                    'celebration',
                    `🎉 إنجاز أسطوري! لقد أكملت شهر كامل من ${perfectMonthAction}${rewardMessage}`
                );
            } else if (!Array.isArray(newlyUnlocked) || newlyUnlocked.length === 0) {
                onSnackbar?.('success', `تم إضافة ${formatArabicPoints(awardedPoints)} بنجاح!`);
            }
        } catch (error) {
            console.error('Failed to save progress:', error);
            setCompletedActions((current) => ({ ...current, [counter]: false }));
            onOptimisticPointsChange?.(-optimisticPoints);
            if (error.response?.data?.code === 'POINT_SETTINGS_CHANGED') {
                setPointSettingsLoaded(false);
                try {
                    const settingsResponse = await api.get('/api/settings/points');
                    setActionPoints(normalizeActionPoints(settingsResponse.data?.data));
                    setPointSettingsLoaded(true);
                    onSnackbar?.('warning', 'تم تحديث إعدادات النقاط. أعد المحاولة بالقيمة الجديدة.');
                } catch (settingsError) {
                    console.error('Failed to refresh action point settings:', settingsError);
                    Alert.alert(
                        'تعذر تحديث إعدادات النقاط',
                        settingsError.response?.data?.message || 'تحقق من اتصال الشبكة ثم أعد فتح الشاشة.'
                    );
                }
            } else if (error.response?.data?.code === 'ALREADY_COMPLETED_TODAY') {
                onSnackbar?.('warning', `لا يمكنك الضغط على زر ${actionLabelsByCounter[counter]} أكثر من مرة في اليوم`);
            } else {
                onSnackbar?.('error', 'لا يوجد اتصال بالإنترنت، يرجى المحاولة لاحقاً.');
            }
        } finally {
            requestInFlight.current = false;
            setIsSubmittingAction(false);
        }
    };

    const isActionDisabled = (counter) =>
        !pointSettingsLoaded || isSubmittingAction || Boolean(completedActions[counter]);

    return (
        <>
            <View style={styles.container}>
                <ButtonIcon
                    name="pray"
                    size={30}
                    onPress={() => openConfirm('الصلاة', 'prayer')}
                    completed={completedActions.prayerCount}
                    disabled={isActionDisabled('prayerCount')}
                />
                <HamburgerBanButton
                    onPress={() => openConfirm('الصوم', 'fasting')}
                    completed={completedActions.fastingCount}
                    disabled={isActionDisabled('fastingCount')}
                />
                <ButtonIcon
                    name="bible"
                    size={30}
                    onPress={() => openConfirm('الكتاب المقدس', 'bible')}
                    completed={completedActions.bibleCount}
                    disabled={isActionDisabled('bibleCount')}
                />
                <ButtonIcon
                    name="church"
                    size={30}
                    onPress={() => openConfirm('الكنيسة', 'church')}
                    completed={completedActions.churchCount}
                    disabled={isActionDisabled('churchCount')}
                />
                <ButtonIcon
                    name="hand-holding-heart"
                    size={27}
                    icon={FontAwesome6}
                    onPress={() => openConfirm('عمل الرحمة', 'goodDeed')}
                    completed={completedActions.goodDeedCount}
                    disabled={isActionDisabled('goodDeedCount')}
                />
            </View>

            <Modal
                visible={confirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setConfirmVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{`هل أنت متأكد من الضغط على زر ${selectedTodo}؟`}</Text>
                        <Text style={styles.modalMessage}>
                            مكافأة النشاط الأساسية{' '}
                            <Text style={styles.modalMessageBold}>{formatArabicPoints(selectedPoints)}</Text>
                            . وقد تُضاف مكافآت إنجازات عند استحقاقها.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setConfirmVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>إلغاء</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAddPoints}
                                disabled={requestInFlight.current}
                            >
                                <Text style={styles.modalButtonText}>إضافة</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    )
}