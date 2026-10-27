import { useCallback, useRef, useEffect, useState } from 'react';
import { View, Image, Animated, Easing, Text, Modal, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from './styles';
import CustomButton from '../../../components/CustomButton/CustomButton';
import SettingsButton from '../../../components/SettingsButton/SettingsButton';
import VerseComponent from '../../../components/VerseComponent/VerseComponent';
import PointNotificationModal from '../../../components/PointNotificationModal/PointNotificationModal';
import AchievementUnlockedModal from '../../../components/AchievementUnlockedModal/AchievementUnlockedModal';
import api from '../../../api/apiClient';
import { formatArabicPoints } from '../../../utils/formatArabicPoints';
import { cacheKnownPoints, getKnownPointsCacheKey } from '../../../utils/pointBalanceCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserPoints } from '../../../context/UserPointsContext';
import showAlert from '../../../utils/showAlert';

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
export default function HomeScreen() {
    const { setUser } = useUserPoints();
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
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pointNotificationAmount, setPointNotificationAmount] = useState(0);
    const [unlockedAchievements, setUnlockedAchievements] = useState([]);
    const [snackbar, setSnackbar] = useState(null);
    const snackbarAnim = useRef(new Animated.Value(0)).current;
    const pointBalanceRef = useRef(null);
    const pointUserIdRef = useRef(null);
    const pointRevisionRef = useRef(0);
    const localPointsSubmissionRef = useRef(false);

    useEffect(() => {
        if (!snackbar) return undefined;

        snackbarAnim.setValue(0);
        Animated.parallel([
            Animated.timing(snackbarAnim, {
                toValue: 1,
                duration: 220,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();

        const timeout = setTimeout(() => {
            Animated.timing(snackbarAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: Platform.OS !== 'web',
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
            if (
                question &&
                (!Number.isSafeInteger(Number(question?.points)) || Number(question?.points) < 0)
            ) {
                throw new Error('The daily question response has an invalid points value.');
            }
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

    useFocusEffect(
        useCallback(() => {
            let active = true;
            let requestInFlight = false;

            const refreshUser = async (consumePointUpdate) => {
                if (!active || requestInFlight) return null;
                requestInFlight = true;
                const pointRevision = pointRevisionRef.current;
                try {
                    const response = await api.get('/api/auth/me', {
                        params: consumePointUpdate ? { consumePointUpdate: 'true' } : undefined,
                    });
                    const currentUser = response.data?.data;
                    if (!active || !currentUser) return null;

                    const currentPoints = Number(currentUser.totalPoints);
                    if (!Number.isFinite(currentPoints)) {
                        console.error('Received invalid total points for the current user:', currentUser.totalPoints);
                        return null;
                    }

                    const userId = String(currentUser.id ?? currentUser._id ?? '');
                    let previousPoints = null;
                    try {
                        const cachedPoints = await AsyncStorage.getItem(getKnownPointsCacheKey(userId));
                        if (cachedPoints !== null) {
                            const parsedPoints = Number(cachedPoints);
                            if (Number.isFinite(parsedPoints)) {
                                previousPoints = parsedPoints;
                            }
                        }
                    } catch (error) {
                        console.error('Failed to read the saved points balance:', error);
                        if (pointUserIdRef.current === userId) {
                            previousPoints = pointBalanceRef.current;
                        }
                    }

                    if (
                        !active ||
                        localPointsSubmissionRef.current ||
                        pointRevision !== pointRevisionRef.current
                    ) return null;
                    try {
                        await cacheKnownPoints(userId, currentPoints);
                    } catch (error) {
                        console.error('Failed to save the latest points balance:', error);
                    }

                    if (
                        !active ||
                        localPointsSubmissionRef.current ||
                        pointRevision !== pointRevisionRef.current
                    ) {
                        if (pointUserIdRef.current === userId && Number.isFinite(pointBalanceRef.current)) {
                            try {
                                await cacheKnownPoints(userId, pointBalanceRef.current);
                            } catch (error) {
                                console.error('Failed to restore the latest points balance:', error);
                            }
                        }
                        return null;
                    }

                    pointUserIdRef.current = userId;
                    pointBalanceRef.current = currentPoints;
                    setLoggedInUser(currentUser);
                    setUser(currentUser);

                    const balanceDifference = previousPoints === null
                        ? 0
                        : currentPoints - previousPoints;
                    const unseenDifference = Number(currentUser.unseenPointsDifference);
                    const notificationDifference = currentUser.hasUnseenPointsUpdate
                        && Number.isFinite(unseenDifference)
                        && unseenDifference !== 0
                        ? unseenDifference
                        : balanceDifference;

                    if (notificationDifference !== 0) {
                        setPointNotificationAmount(notificationDifference);
                        setIsModalVisible(true);
                    }

                    return currentUser;
                } catch (error) {
                    console.error('Failed to refresh current user points:', error.response?.data || error);
                    return null;
                } finally {
                    requestInFlight = false;
                }
            };

            const loadHomeData = async () => {
                const currentUser = await refreshUser(true);
                const userId = currentUser?.id ?? currentUser?._id;
                if (active && userId) {
                    await loadDailyQuestion(userId);
                }
            };

            loadHomeData();

            return () => {
                active = false;
            };
        }, [loadDailyQuestion]),
    );

    const updatePoints = async (
        amount,
        totalPoints,
        optimisticPoints = 0,
        userId = pointUserIdRef.current,
        maxPoints
    ) => {
        const pointsDelta = Number(amount);
        if (!Number.isSafeInteger(pointsDelta)) {
            console.error('Received an invalid points adjustment:', amount);
            return;
        }

        const responseBalance = Number(totalPoints);
        const updatedPoints = Number.isSafeInteger(responseBalance)
            ? responseBalance
            : (Number(pointBalanceRef.current) || 0) + pointsDelta - optimisticPoints;
        const responseMaxPoints = Number(maxPoints);
        const updatedMaxPoints = Math.max(
            Number(loggedInUser?.maxPoints) || 0,
            Number.isSafeInteger(responseMaxPoints) ? responseMaxPoints : 0,
            updatedPoints
        );
        pointRevisionRef.current += 1;
        pointBalanceRef.current = updatedPoints;
        setLoggedInUser((current) => ({
            ...(current || {}),
            totalPoints: updatedPoints,
            maxPoints: Math.max(Number(current?.maxPoints) || 0, updatedPoints),
        }));
        setUser((current) => current
            ? {
                ...current,
                totalPoints: updatedPoints,
                maxPoints: Math.max(
                    Number(current.maxPoints) || 0,
                    Number.isSafeInteger(responseMaxPoints) ? responseMaxPoints : 0,
                    updatedPoints
                ),
            }
            : { totalPoints: updatedPoints, maxPoints: updatedMaxPoints });
        if (userId) {
            try {
                await cacheKnownPoints(userId, updatedPoints);
            } catch (error) {
                console.error('Failed to cache the updated points balance:', error);
            }
        }
    };

    useEffect(() => {
        if (Platform.OS === 'web') return undefined;

        Animated.loop(
            Animated.sequence([
                Animated.timing(moveAnim, {
                    toValue: -1500,
                    duration: 100000,
                    easing: Easing.linear,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        ).start();

        return undefined;
    }, [moveAnim]);

    const handleOptimisticPointsChange = (pointsDelta) => {
        const updatedPoints = (Number(pointBalanceRef.current) || 0) + pointsDelta;
        pointRevisionRef.current += 1;
        pointBalanceRef.current = updatedPoints;
        setLoggedInUser((current) => ({
            ...(current || {}),
            totalPoints: updatedPoints,
        }));
        setUser((current) => current
            ? { ...current, totalPoints: updatedPoints }
            : { totalPoints: updatedPoints });
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
            expectedPoints: Number(dailyQuestion?.points),
            ...(userId ? { user_id: String(userId) } : {}),
        };

        if (typeof questionId !== 'string' || !/^[a-f\d]{24}$/i.test(questionId)) {
            showAlert('تعذر إرسال الإجابة', 'بيانات السؤال غير صالحة. يرجى تحديث الصفحة والمحاولة مجددًا.');
            return;
        }
        if (!Number.isInteger(selectedOption) || selectedOption < 0) {
            showAlert('تعذر إرسال الإجابة', 'يرجى اختيار إجابة صالحة.');
            return;
        }

        localPointsSubmissionRef.current = true;
        pointRevisionRef.current += 1;
        setDailySubmitting(true);
        try {
            const token = await AsyncStorage.getItem('st_paisios_token');
            if (!token) {
                showAlert('تعذر إرسال الإجابة', 'انتهت صلاحية تسجيل الدخول. يرجى تسجيل الدخول مجددًا.');
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
            const awardedPoints = Number(result?.awardedPoints);
            if (!Number.isSafeInteger(awardedPoints) || awardedPoints < 0 || (!isCorrect && awardedPoints !== 0)) {
                throw new Error('The daily question response has an invalid awarded points value.');
            }
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
            await updatePoints(
                awardedPoints,
                Number.isFinite(updatedPoints) ? updatedPoints : undefined,
                0,
                userId,
                result?.maxPoints
            );
            setShowDailySuccessModal(true);
        } catch (error) {
            console.log("Submit Payload Sent:", payload);
            console.log("Submit Server Error:", error.response?.data);
            if (error.response?.data?.code === 'POINT_SETTINGS_CHANGED') {
                await loadDailyQuestion(userId);
                showAlert(
                    'تم تحديث مكافأة السؤال',
                    'تم تحميل قيمة المكافأة الجديدة. راجعها ثم أعد إرسال إجابتك.'
                );
            } else if (error.response?.status === 409) {
                if (userId) {
                    await saveDailyAnsweredDate(userId, localDate);
                }
                setDailyAnswered(true);
                setModalVisible(false);
                setShowDailyCompletion(true);
            } else if (!error.response) {
                console.error('Failed to submit today’s daily question:', error);
                showAlert('تعذر الاتصال', 'تحقق من اتصالك بالإنترنت ثم حاول مجددًا.');
            } else {
                console.error('Failed to submit today’s daily question:', error);
                showAlert(
                    'تعذر إرسال الإجابة',
                    error.response.data?.message || 'تعذر إرسال الإجابة. يرجى المحاولة مجددًا.'
                );
            }
        } finally {
            localPointsSubmissionRef.current = false;
            setDailySubmitting(false);
        }
    };

    const closeWrongAnswerModal = () => {
        setShowWrongAnswerModal(false);
        setModalVisible(false);
        setShowDailyCompletion(false);
    };

    return (
        <View style={styles.container}>
            <SettingsButton />
            <VerseComponent />
            <CustomButton
                onPointsAwarded={updatePoints}
                onOptimisticPointsChange={handleOptimisticPointsChange}
                onSnackbar={(type, message) => setSnackbar({ type, message })}
                onAchievementsUnlocked={setUnlockedAchievements}
            />

            <AchievementUnlockedModal
                achievements={unlockedAchievements}
                onClose={() => setUnlockedAchievements([])}
            />

            <PointNotificationModal
                visible={isModalVisible}
                points={pointNotificationAmount}
                onClose={() => setIsModalVisible(false)}
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
                source={require('../../../assets/images/st-paisios.jpg')}
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
                                المكافأة: {formatArabicPoints(Number(dailyQuestion?.points ?? 0))}
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
                            إجابة صحيحة ✅ لقد كسبت {formatArabicPoints(dailyAwardedPoints)}!
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

        </View>
    );
}