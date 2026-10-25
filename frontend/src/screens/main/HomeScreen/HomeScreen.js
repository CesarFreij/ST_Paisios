import { useCallback, useRef, useEffect, useState } from 'react';
import { Alert, View, Image, Animated, Easing, Text, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from './styles';
import CustomButton from '../../../components/CustomButton/CustomButton';
import SettingsButton from '../../../components/SettingsButton/SettingsButton';
import VerseComponent from '../../../components/VerseComponent/VerseComponent';
import authService from '../../../services/authService';
import api from '../../../api/apiClient';
import { formatArabicPoints } from '../../../utils/formatArabicPoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFETTI_COLORS = ['#f6c453', '#e85d75', '#53b6a8', '#7c6ee6', '#f08b3e'];
const getCurrentLocalDate = () => {
    const dateParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Damascus',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const dateValues = Object.fromEntries(
        dateParts.map(({ type, value }) => [type, value])
    );
    return `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
};
const getDailyAnswerCacheKey = (userId) => `last_answered_daily_date:${userId}`;
const saveDailyAnsweredDate = async (userId, localDate) => {
    try {
        await AsyncStorage.setItem(getDailyAnswerCacheKey(userId), localDate);
    } catch (error) {
        console.error('Failed to cache the daily-question answer date:', error);
    }
};
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    width: 7 + (index % 4),
    rotation: `${(index % 2 ? 1 : -1) * (180 + index * 11)}deg`,
}));

export default function HomeScreen() {
    const moveAnim = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(false);
    const [showDailyCompletion, setShowDailyCompletion] = useState(false);
    const [showDailySuccessModal, setShowDailySuccessModal] = useState(false);
    const [showWrongAnswerModal, setShowWrongAnswerModal] = useState(false);
    const [dailyQuestion, setDailyQuestion] = useState(null);
    const [dailyAnswered, setDailyAnswered] = useState(false);
    const [dailyResult, setDailyResult] = useState(null);
    const [dailyAwardedPoints, setDailyAwardedPoints] = useState(0);
    const [dailySubmitting, setDailySubmitting] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [pointNotifications, setPointNotifications] = useState([]);
    const [snackbar, setSnackbar] = useState(null);
    const snackbarAnim = useRef(new Animated.Value(0)).current;
    const confettiAnimations = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
    const activePointNotification = pointNotifications[0] || null;

    useEffect(() => {
        if (!snackbar) return undefined;

        snackbarAnim.setValue(0);
        Animated.parallel([
            Animated.timing(snackbarAnim, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start();

        const timeout = setTimeout(() => {
            Animated.timing(snackbarAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) setSnackbar(null);
            });
        }, 3000);

        return () => {
            clearTimeout(timeout);
            snackbarAnim.stopAnimation();
        };
    }, [snackbar, snackbarAnim]);

    const loadDailyQuestion = useCallback(async (userId) => {
        if (!userId) return;

        const localDate = getCurrentLocalDate();
        const cacheKey = getDailyAnswerCacheKey(userId);
        let cachedDate = null;
        try {
            cachedDate = await AsyncStorage.getItem(cacheKey);
        } catch (error) {
            console.error('Failed to read the daily-question answer cache:', error);
        }

        if (cachedDate === localDate) {
            setDailyQuestion(null);
            setDailyAnswered(true);
            setDailyResult(null);
            setDailyAwardedPoints(0);
            setShowDailyCompletion(false);
            setShowDailySuccessModal(false);
            setShowWrongAnswerModal(false);
            setModalVisible(false);
            return;
        }

        try {
            const token = await AsyncStorage.getItem('st_paisios_token');
            if (!token) {
                console.error('Cannot fetch today’s daily question without an authentication token.');
                return;
            }

            console.log("Sending user_id to server:", userId);
            const response = await api.get('/api/daily-question/today', {
                params: { user_id: userId, localDate },
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data?.data ?? response.data;
            const hasAnsweredToday = Boolean(data?.has_answered_today ?? data?.hasAnsweredToday);
            if (hasAnsweredToday) {
                await saveDailyAnsweredDate(userId, localDate);
            }
            const question = data?.question
                ? { ...data.question, localDate: data.localDate }
                : null;
            setDailyQuestion(question);
            setDailyAnswered(hasAnsweredToday);
            setDailyResult(null);
            setDailyAwardedPoints(0);
            setShowDailyCompletion(hasAnsweredToday);
            setModalVisible(Boolean(question) && !hasAnsweredToday);
        } catch (error) {
            console.log("Server Error Details:", error.response?.data);
            console.error('Failed to fetch today’s daily question:', error);
        }
    }, []);

    const loadPointNotifications = async () => {
        try {
            const response = await api.get('/api/progress');
            const notifications = response.data?.data?.pointNotifications;
            setPointNotifications(Array.isArray(notifications) ? notifications : []);
        } catch (error) {
            console.error('Failed to fetch unread point notifications:', error);
        }
    };

    const closePointNotification = async () => {
        if (!activePointNotification?._id) return;
        try {
            await api.put('/api/users/notifications/mark-read', {
                notificationIds: [activePointNotification._id],
            });
            setPointNotifications((current) => current.slice(1));
        } catch (error) {
            console.error('Failed to mark point notification as read:', error);
            Alert.alert('تعذر تحديث الإشعار', 'تحقق من اتصالك بالإنترنت ثم حاول إغلاق الإشعار مجددًا.');
        }
    };

    useEffect(() => {
        if (!activePointNotification?.isPositive) return undefined;
        confettiAnimations.forEach((animation) => animation.setValue(0));
        const animation = Animated.stagger(
            45,
            confettiAnimations.map((value) =>
                Animated.timing(value, { toValue: 1, duration: 1400, useNativeDriver: true })
            )
        );
        animation.start();
        return () => animation.stop();
    }, [activePointNotification?._id, activePointNotification?.isPositive, confettiAnimations]);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            const loadUser = async () => {
                try {
                    const currentUser = await authService.getCurrentUser();
                    if (active && currentUser) {
                        setLoggedInUser(currentUser);
                        await loadDailyQuestion(currentUser.id ?? currentUser._id);
                    }
                } catch (error) {
                    console.error('Failed to load signed-in user:', error);
                }
            };

            loadUser();
            return () => {
                active = false;
            };
        }, [loadDailyQuestion]),
    );

    const handlePointsAwarded = (awardedPoints, totalPoints, optimisticPoints = 0) => {
        setLoggedInUser((current) => ({
            ...(current || {}),
            totalPoints: Number.isFinite(totalPoints)
                ? totalPoints
                : (Number(current?.totalPoints) || 0) + awardedPoints - optimisticPoints,
        }));
    };

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(moveAnim, {
                    toValue: -1500,
                    duration: 100000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();

    }, []);

    const handleOptimisticPointsChange = (pointsDelta) => {
        setLoggedInUser((current) => ({
            ...(current || {}),
            totalPoints: (Number(current?.totalPoints) || 0) + pointsDelta,
        }));
    };

    const handleDailyAnswer = async (index) => {
        if (dailyAnswered || dailySubmitting || !dailyQuestion) return;
        const questionId = dailyQuestion.id || dailyQuestion._id;
        const selectedOption = Number(index);
        const userId = loggedInUser?.id ?? loggedInUser?._id;
        const localDate = getCurrentLocalDate();
        const payload = {
            questionId,
            selectedOption,
            localDate,
            ...(userId ? { user_id: String(userId) } : {}),
        };

        if (typeof questionId !== 'string' || !/^[a-f\d]{24}$/i.test(questionId)) {
            Alert.alert('تعذر إرسال الإجابة', 'بيانات السؤال غير صالحة. يرجى تحديث الصفحة والمحاولة مجددًا.');
            return;
        }
        if (!Number.isInteger(selectedOption) || selectedOption < 0) {
            Alert.alert('تعذر إرسال الإجابة', 'يرجى اختيار إجابة صالحة.');
            return;
        }

        setDailySubmitting(true);
        try {
            const token = await AsyncStorage.getItem('st_paisios_token');
            if (!token) {
                Alert.alert('تعذر إرسال الإجابة', 'انتهت صلاحية تسجيل الدخول. يرجى تسجيل الدخول مجددًا.');
                return;
            }

            const response = await api.post('/api/daily-question/submit', payload, {
                params: userId ? { user_id: userId, localDate: payload.localDate } : { localDate: payload.localDate },
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = response.data?.data
                ? { ...response.data.data, ...response.data }
                : response.data;
            const isCorrect = result?.is_correct === true || result?.isCorrect === true;
            const awardedPoints = isCorrect ? 1 : 0;
            if (userId) {
                await saveDailyAnsweredDate(userId, localDate);
            }
            setDailyResult(isCorrect ? 'correct' : 'wrong');
            setDailyAwardedPoints(awardedPoints);
            setDailyAnswered(true);
            setModalVisible(false);
            if (!isCorrect) {
                setShowWrongAnswerModal(true);
                return;
            }
            const updatedPoints = Number(result?.updated_points ?? result?.totalPoints);
            handlePointsAwarded(
                awardedPoints,
                Number.isFinite(updatedPoints) ? updatedPoints : undefined
            );
            setShowDailySuccessModal(true);
            loadPointNotifications();
        } catch (error) {
            console.log("Submit Payload Sent:", payload);
            console.log("Submit Server Error:", error.response?.data);
            if (error.response?.status === 409) {
                if (userId) {
                    await saveDailyAnsweredDate(userId, localDate);
                }
                setDailyAnswered(true);
                setModalVisible(false);
                setShowDailyCompletion(true);
            } else if (!error.response) {
                console.error('Failed to submit today’s daily question:', error);
                Alert.alert('تعذر الاتصال', 'تحقق من اتصالك بالإنترنت ثم حاول مجددًا.');
            } else {
                console.error('Failed to submit today’s daily question:', error);
                Alert.alert(
                    'تعذر إرسال الإجابة',
                    error.response.data?.message || 'تعذر إرسال الإجابة. يرجى المحاولة مجددًا.'
                );
            }
        } finally {
            setDailySubmitting(false);
        }
    };

    const closeWrongAnswerModal = () => {
        setShowWrongAnswerModal(false);
        setModalVisible(false);
        setShowDailyCompletion(false);
        loadPointNotifications();
    };

    return (
        <View style={styles.container}>
            <SettingsButton />
            <VerseComponent />
            <CustomButton
                onPointsAwarded={handlePointsAwarded}
                onOptimisticPointsChange={handleOptimisticPointsChange}
                onSnackbar={(type, message) => setSnackbar({ type, message })}
            />

            {snackbar && (
                <Animated.View
                    accessibilityRole="alert"
                    style={[
                        styles.snackbar,
                        snackbar.type === 'celebration'
                            ? styles.snackbarCelebration
                            : snackbar.type === 'success'
                                ? styles.snackbarSuccess
                                : snackbar.type === 'error'
                                    ? styles.snackbarError
                                    : styles.snackbarWarning,
                        {
                            opacity: snackbarAnim,
                            transform: [{
                                translateY: snackbarAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [24, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    <Text style={styles.snackbarText}>{snackbar.message}</Text>
                </Animated.View>
            )}

            <Image
                source={require('../../../assets/images/st-paisios.png')}
                style={styles.icon}
                resizeMode="cover"
            />
            <Animated.View style={{ width: '3000', height: '100%', position: 'absolute', bottom: -100, start: 0 }}>
                <Animated.Image
                    source={require('../../../assets/images/bg.jpg')}
                    style={[
                        styles.mountain,
                        {
                            transform: [{ translateX: moveAnim }],
                        },
                    ]}
                    resizeMode="repeat"
                />
            </Animated.View>

            <Modal
                visible={showDailyCompletion}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDailyCompletion(false)}
            >
                <View style={styles.dailyCompletedOverlay}>
                    <View
                        accessibilityRole="alert"
                        accessibilityViewIsModal
                        style={styles.dailyCompletedCard}
                    >
                        <View style={styles.dailyCompletedIcon}>
                            <Text style={styles.dailyCompletedIconText}>✓</Text>
                        </View>
                        <Text style={styles.dailyCompletedTitle}>أتممت المهمة! ✅</Text>
                        <Text style={styles.dailyCompletedSubtitle}>
                            لقد أجبت على سؤال اليوم مسبقاً. عُد غداً لتحدٍ جديد وكسب المزيد من النقاط!
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            style={styles.dailyCompletedButton}
                            activeOpacity={0.85}
                            onPress={() => setShowDailyCompletion(false)}
                        >
                            <Text style={styles.dailyCompletedButtonText}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={modalVisible && Boolean(dailyQuestion)}
                transparent
                animationType="fade"
                onRequestClose={() => {}}
            >
                <View style={styles.dailyModalOverlay}>
                    <View style={styles.dailyModalCard}>
                        <Text style={styles.dailyModalTitle}>سؤال اليوم</Text>
                        <Text style={styles.dailyQuestionText}>{dailyQuestion?.question}</Text>

                        {dailyQuestion?.options.map((answer, index) => (
                            <TouchableOpacity
                                key={`${dailyQuestion.id}-${index}`}
                                style={styles.dailyAnswerOption}
                                activeOpacity={0.8}
                                onPress={() => handleDailyAnswer(index)}
                                disabled={dailySubmitting || dailyAnswered}
                            >
                                <Text style={styles.dailyAnswerText}>{answer}</Text>
                            </TouchableOpacity>
                        ))}
                        {!dailyAnswered && (
                            <Text style={styles.dailyResultSubText}>
                                المكافأة: {formatArabicPoints(1)}
                            </Text>
                        )}

                        {dailyResult === 'correct' && (
                            <View style={[styles.dailyResultBox, styles.dailyResultSuccess]}>
                                <Text style={styles.dailyResultText}>أحسنت 🎉</Text>
                                <Text style={styles.dailyResultSubText}>
                                    +{formatArabicPoints(dailyAwardedPoints)}
                                </Text>
                            </View>
                        )}

                        {dailyResult === 'wrong' && (
                            <View style={[styles.dailyResultBox, styles.dailyResultError]}>
                                <Text style={styles.dailyResultText}>إجابة غير صحيحة</Text>
                                <Text style={styles.dailyResultSubText}>حاول غداً</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showDailySuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDailySuccessModal(false)}
            >
                <View style={styles.dailySuccessOverlay}>
                    <View
                        accessibilityRole="alert"
                        accessibilityViewIsModal
                        style={styles.dailySuccessCard}
                    >
                        <View style={styles.dailySuccessIcon}>
                            <Text style={styles.dailySuccessIconText}>✓</Text>
                        </View>
                        <Text style={styles.dailySuccessMessage}>
                            إجابة صحيحة ✅ لقد كسبت نقطة جديدة!
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            style={styles.dailySuccessButton}
                            activeOpacity={0.85}
                            onPress={() => setShowDailySuccessModal(false)}
                        >
                            <Text style={styles.dailySuccessButtonText}>متابعة</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showWrongAnswerModal}
                transparent
                animationType="fade"
                onRequestClose={closeWrongAnswerModal}
            >
                <View style={styles.wrongAnswerOverlay}>
                    <View
                        accessibilityRole="alert"
                        accessibilityViewIsModal
                        style={styles.wrongAnswerCard}
                    >
                        <View style={styles.wrongAnswerIcon}>
                            <Text style={styles.wrongAnswerIconText}>✕</Text>
                        </View>
                        <Text style={styles.wrongAnswerTitle}>إجابة خاطئة ❌</Text>
                        <Text style={styles.wrongAnswerMessage}>
                            للأسف إجابتك غير صحيحة ولم تربح أي نقاط. حظاً أوفر في المرة القادمة!
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            style={styles.wrongAnswerButton}
                            activeOpacity={0.85}
                            onPress={closeWrongAnswerModal}
                        >
                            <Text style={styles.wrongAnswerButtonText}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={Boolean(activePointNotification)}
                transparent
                animationType="fade"
                onRequestClose={closePointNotification}
            >
                <View style={styles.dailyModalOverlay}>
                    <View style={styles.dailyModalCard}>
                        {activePointNotification?.isPositive && (
                            <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}>
                                {CONFETTI_PARTICLES.map((particle, index) => {
                                    const progress = confettiAnimations[index];
                                    return (
                                        <Animated.View
                                            key={index}
                                            style={{
                                                position: 'absolute',
                                                top: -16,
                                                left: particle.left,
                                                width: particle.width,
                                                height: particle.width * 1.5,
                                                borderRadius: 2,
                                                backgroundColor: particle.color,
                                                opacity: progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                                                transform: [
                                                    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 340] }) },
                                                    { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', particle.rotation] }) },
                                                ],
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        )}
                        <Text style={styles.dailyModalTitle}>
                            {activePointNotification?.isPositive ? 'مبارك!' : 'تنبيه:'}
                        </Text>
                        <Text style={styles.dailyQuestionText}>
                            {activePointNotification?.isPositive
                                ? `تم منحك ${formatArabicPoints(Number(activePointNotification.amount))}`
                                : `تم خصم ${formatArabicPoints(Number(activePointNotification?.amount))} من رصيدك`}
                        </Text>
                        <TouchableOpacity
                            style={styles.sheetButton}
                            activeOpacity={0.8}
                            onPress={closePointNotification}
                        >
                            <Text style={styles.sheetButtonText}>حسنًا</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}