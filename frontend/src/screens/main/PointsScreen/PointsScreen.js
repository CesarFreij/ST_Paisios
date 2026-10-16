import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Easing, View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../api/apiClient';
import styles from './styles';

const getDaysInCurrentMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getDaysInMonth = (monthYear) => {
    const [year, month] = monthYear.split('-').map(Number);
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const toMarkedDates = (dates, color) => {
    if (!Array.isArray(dates)) return {};
    return dates.reduce((markedDates, dateString) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            markedDates[dateString] = {
                selected: true,
                selectedColor: color,
            };
        }
        return markedDates;
    }, {});
};

const getMonthCalendar = (markedDates, monthYear) =>
    Array.from({ length: getDaysInMonth(monthYear) }, (_, index) => {
        const day = String(index + 1).padStart(2, '0');
        return markedDates[`${monthYear}-${day}`]?.selected === true;
    });

const getCurrentMonthYear = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const normalizeCount = (count) => Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;

const calculatePercentage = (completedDays, totalDays) => {
    if (!Number.isFinite(completedDays) || !Number.isFinite(totalDays) || totalDays <= 0) {
        return 0;
    }
    return Math.round((completedDays / totalDays) * 100);
};

const formatArabicPoints = (points) => {
    const count = Number(points) || 0;
    if (count === 1) return 'نقطة';
    if (count === 2) return 'نقطتان';
    if (count >= 3 && count <= 10) return `${count} نقاط`;
    return `${count} نقطة`;
};

const monthNames = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

export default function PointsScreen() {
    const navigation = useNavigation();
    const [pointsData, setPointsData] = useState([
        { id: 'prayer', title: '🙏 الصلاة', count: 0, points: 0 },
        { id: 'fasting', title: '🚫 الصوم', count: 0, points: 0 },
        { id: 'bible', title: '📖 قراءة الكتاب المقدس', count: 0, points: 0 },
        { id: 'church', title: '⛪ الذهاب إلى الكنيسة', count: 0, points: 0 },
        { id: 'good', title: '❤️ عمل الرحمة', count: 0, points: 0 },
    ]);
    const [prayerMarkedDates, setPrayerMarkedDates] = useState({});
    const [bibleMarkedDates, setBibleMarkedDates] = useState({});
    const [calendarMonthYear, setCalendarMonthYear] = useState(getCurrentMonthYear);
    const [userData, setUserData] = useState({ name: '', rank: '', streak: 0, points: 0 });
    const [backendTotalPoints, setBackendTotalPoints] = useState(0);
    const [totalEarnedPoints, setTotalEarnedPoints] = useState(0);
    const [totalDeductedPoints, setTotalDeductedPoints] = useState(0);
    const [quizPoints, setQuizPoints] = useState(0);
    const [extraPoints, setExtraPoints] = useState(0);
    const [userLoading, setUserLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const totalPointsValue = useRef(new Animated.Value(0)).current;
    const totalTasksValue = useRef(new Animated.Value(0)).current;

    const prayerCardAnim = useRef(new Animated.Value(0)).current;
    const bibleCardAnim = useRef(new Animated.Value(0)).current;
    const prayerProgress = useRef(new Animated.Value(0)).current;
    const bibleProgress = useRef(new Animated.Value(0)).current;
    const prayerGlow = useRef(new Animated.Value(0)).current;
    const bibleGlow = useRef(new Animated.Value(0)).current;

    const prayerCalendar = useMemo(
        () => getMonthCalendar(prayerMarkedDates, calendarMonthYear),
        [prayerMarkedDates, calendarMonthYear]
    );
    const bibleCalendar = useMemo(
        () => getMonthCalendar(bibleMarkedDates, calendarMonthYear),
        [bibleMarkedDates, calendarMonthYear]
    );

    const prayerDayAnims = useRef(Array.from({ length: getDaysInCurrentMonth() }, () => new Animated.Value(1))).current;
    const bibleDayAnims = useRef(Array.from({ length: getDaysInCurrentMonth() }, () => new Animated.Value(1))).current;

    const totalPoints = backendTotalPoints;
    const totalTasks = useMemo(() => pointsData.reduce((sum, item) => sum + item.count, 0), [pointsData]);
    const mostActivity = useMemo(() => {
        if (pointsData.every((item) => item.count === 0)) return { title: '', count: 0 };
        return pointsData.reduce((best, item) => (item.count > best.count ? item : best), pointsData[0]);
    }, [pointsData]);
    const leastActivity = useMemo(() => {
        if (pointsData.every((item) => item.count === 0)) return { title: '', count: 0 };
        return pointsData.reduce((worst, item) => (item.count < worst.count ? item : worst), pointsData[0]);
    }, [pointsData]);

    const prayerTotal = useMemo(() => prayerCalendar.filter(Boolean).length, [prayerCalendar]);
    const bibleTotal = useMemo(() => bibleCalendar.filter(Boolean).length, [bibleCalendar]);
    const prayerDays = prayerCalendar.length;
    const bibleDays = bibleCalendar.length;

    const prayerRate = calculatePercentage(prayerTotal, prayerDays);
    const bibleRate = calculatePercentage(bibleTotal, bibleDays);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            setIsLoading(true);

            setPointsData((current) => current.map((item) => ({ ...item, count: 0, points: 0 })));
            setPrayerMarkedDates({});
            setBibleMarkedDates({});
            setCalendarMonthYear(getCurrentMonthYear());
            setUserData({ name: '', rank: '', streak: 0, points: 0 });
            setBackendTotalPoints(0);
            setTotalEarnedPoints(0);
            setTotalDeductedPoints(0);
            setQuizPoints(0);
            setExtraPoints(0);
            setUserLoading(true);

            const fetchProgress = async () => {
                try {
                    const [response, calendarResponse] = await Promise.all([
                        api.get('/api/progress'),
                        api.get('/api/calendar/my-dates'),
                    ]);
                    const payload = response.data?.data ?? response.data ?? {};
                    const calendarData = calendarResponse.data?.data;
                    const calendarLogs = calendarData?.calendarLogs;
                    if (!Array.isArray(calendarLogs?.prayerDays) || !Array.isArray(calendarLogs?.bibleDays)) {
                        throw new Error('Invalid calendar dates response.');
                    }
                    const progress = payload.progress ?? payload;
                    const user = payload.user ?? progress.user ?? {};
                    const countFields = { prayer: 'prayerCount', fasting: 'fastingCount', bible: 'bibleCount', church: 'churchCount', good: 'goodDeedCount' };
                    const pointFields = { prayer: 'prayer', fasting: 'fasting', bible: 'bible', church: 'church', good: 'goodDeed' };
                    const pointsByActivity = payload.pointsByActivity ?? {};
                    const canonicalTotalPoints = Number(
                        payload.totalPoints ?? user.totalPoints ?? progress.totalPoints ?? userData.points ?? 0
                    );
                    const canonicalExtraPoints = Number(payload.extraPoints ?? user.extraPoints ?? 0);
                    const canonicalQuizPoints = Number(payload.quizPoints ?? user.quizPoints ?? 0);
                    const canonicalEarnedPoints = Number(
                        payload.totalEarnedPoints ?? user.totalEarnedPoints ?? Math.max(canonicalTotalPoints, 0)
                    );
                    const canonicalDeductedPoints = Number(
                        payload.totalDeductedPoints ?? user.totalDeductedPoints ?? 0
                    );

                    if (!isActive) return;

                    setPointsData((current) => current.map((item) => {
                        const count = normalizeCount(progress[countFields[item.id]]);
                        const points = Number(pointsByActivity[pointFields[item.id]]);
                        return { ...item, count, points: Number.isFinite(points) ? points : 0 };
                    }));
                    setBackendTotalPoints(Number.isFinite(canonicalTotalPoints) ? canonicalTotalPoints : 0);
                    setTotalEarnedPoints(Number.isFinite(canonicalEarnedPoints) ? canonicalEarnedPoints : 0);
                    setTotalDeductedPoints(Number.isFinite(canonicalDeductedPoints) ? canonicalDeductedPoints : 0);
                    setQuizPoints(Number.isFinite(canonicalQuizPoints) ? canonicalQuizPoints : 0);
                    setExtraPoints(Number.isFinite(canonicalExtraPoints) ? canonicalExtraPoints : 0);
                    const currentMonth = /^\d{4}-\d{2}$/.test(calendarData.currentMonthYear)
                        ? calendarData.currentMonthYear
                        : getCurrentMonthYear();
                    setPrayerMarkedDates(toMarkedDates(calendarLogs.prayerDays, '#d8f0e2'));
                    setBibleMarkedDates(toMarkedDates(calendarLogs.bibleDays, '#d8f0e2'));
                    setCalendarMonthYear(currentMonth);
                    setUserData((current) => ({
                        name: user.username || user.name || progress.name || progress.username || current.name,
                        rank: typeof progress.rank === 'string' ? progress.rank : typeof user.rank === 'string' ? user.rank : current.rank,
                        streak: normalizeCount(progress.streak ?? user.streak),
                        points: Number.isFinite(canonicalTotalPoints) ? canonicalTotalPoints : current.points,
                    }));
                } catch (error) {
                    if (isActive) console.error('Failed to fetch progress:', error);
                } finally {
                    if (isActive) {
                        setIsLoading(false);
                        setUserLoading(false);
                    }
                }
            };

            fetchProgress();
            return () => { isActive = false; };
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        Animated.timing(totalPointsValue, { toValue: totalPoints, duration: 1200, useNativeDriver: false }).start();
        Animated.timing(totalTasksValue, { toValue: totalTasks, duration: 1200, useNativeDriver: false }).start();
    }, [totalPoints, totalTasks]);

    useFocusEffect(
        useCallback(() => {
            prayerCardAnim.setValue(0);
            bibleCardAnim.setValue(0);
            prayerProgress.setValue(0);
            bibleProgress.setValue(0);
            prayerGlow.setValue(0);
            bibleGlow.setValue(0);

            prayerDayAnims.forEach((anim, index) => { if (prayerCalendar[index] && anim) anim.setValue(0); });
            bibleDayAnims.forEach((anim, index) => { if (bibleCalendar[index] && anim) anim.setValue(0); });

            Animated.parallel([
                Animated.timing(prayerCardAnim, { toValue: 1, duration: 550, delay: 160, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(bibleCardAnim, { toValue: 1, duration: 550, delay: 320, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(prayerProgress, { toValue: prayerRate, duration: 1200, delay: 120, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(bibleProgress, { toValue: bibleRate, duration: 1200, delay: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(prayerGlow, { toValue: 1, duration: 1200, delay: 120, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(bibleGlow, { toValue: 1, duration: 1200, delay: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ]).start();

            Animated.stagger(26, prayerCalendar.map((active, index) =>
                active && prayerDayAnims[index] ? Animated.timing(prayerDayAnims[index], { toValue: 1, duration: 360, delay: 240 + index * 8, easing: Easing.out(Easing.ease), useNativeDriver: true }) : Animated.delay(0)
            )).start();

            Animated.stagger(26, bibleCalendar.map((active, index) =>
                active && bibleDayAnims[index] ? Animated.timing(bibleDayAnims[index], { toValue: 1, duration: 360, delay: 320 + index * 8, easing: Easing.out(Easing.ease), useNativeDriver: true }) : Animated.delay(0)
            )).start();
        }, [prayerCalendar, bibleCalendar, prayerRate, bibleRate])
    );

    const animatedTotalPoints = totalPointsValue.interpolate({ inputRange: [0, Math.max(totalPoints, 1)], outputRange: [0, totalPoints] });
    const animatedTotalTasks = totalTasksValue.interpolate({ inputRange: [0, Math.max(totalTasks, 1)], outputRange: [0, totalTasks] });

    const getCurrentMonth = () => {
        const [year, month] = calendarMonthYear.split('-').map(Number);
        return `${monthNames[month - 1] || monthNames[0]} ${year}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#348cb2" />
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>نقاطي</Text>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.backText}>رجوع</Text>
                            <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
                        </TouchableOpacity>
                    </View>

                    <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
                        <Animated.View style={[styles.premiumCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                            <View style={styles.premiumHeader}>
                                <Text style={styles.userName}>
                                    {userData?.name || (userLoading ? 'جاري التحميل...' : 'المستخدم')}
                                </Text>
                                <FontAwesome5 name="user-circle" size={28} color="rgba(255,255,255,0.9)" />
                            </View>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>⭐ النقاط الكلية</Text>
                                    <Text style={styles.summaryValue}>{formatArabicPoints(totalPoints)}</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>النقاط المكتسبة</Text>
                                    <Text style={styles.summaryValue}>{formatArabicPoints(totalEarnedPoints)}</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>النقاط المخصومة</Text>
                                    <Text style={styles.summaryValue}>{formatArabicPoints(totalDeductedPoints)}</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
                            <Text style={styles.sectionTitle}>تفاصيل النقاط</Text>
                            {pointsData.map((item) => (
                                <View key={item.id} style={styles.detailItem}>
                                    <View style={styles.detailHeader}>
                                        <Text style={styles.detailTitle}>{item.title}</Text>
                                        <Text style={styles.detailPoints}>{formatArabicPoints(item.points)}</Text>
                                    </View>
                                    <View style={styles.detailMeta}>
                                        <Text style={styles.detailMetaText}>عدد المرات: {item.count} مرة</Text>
                                    </View>
                                </View>
                            ))}
                            <View style={styles.detailItem}>
                                <View style={styles.detailHeader}>
                                    <Text style={styles.detailTitle}>نقاط الاختبارات {'\n'}(يومية/أسبوعية)</Text>
                                    <Text style={styles.detailPoints}>{formatArabicPoints(quizPoints)}</Text>
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <View style={styles.detailHeader}>
                                    <Text style={styles.detailTitle}>🎁 نقاط إدارية {'\n'}(إضافية/مخصومة)</Text>
                                    <Text style={styles.detailPoints}>{formatArabicPoints(extraPoints)}</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
                            <Text style={styles.sectionTitle}>إحصائيات</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statsBox}>
                                    <Text style={styles.statsLabel}>إجمالي الأعمال المنجزة</Text>
                                    <Text style={styles.statsValue}>{totalTasks}</Text>
                                </View>
                                <View style={styles.statsBox}>
                                    <Text style={styles.statsLabel}>إجمالي النقاط</Text>
                                    <Text style={styles.statsValue}>{totalPoints}</Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statsBox}>
                                    <Text style={styles.statsLabel}>أكثر نشاط قمت به</Text>
                                    <Text style={styles.statsValue}>{mostActivity.title}</Text>
                                </View>
                                <View style={styles.statsBox}>
                                    <Text style={styles.statsLabel}>أقل نشاط قمت به</Text>
                                    <Text style={styles.statsValue}>{leastActivity.title}</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
                            <Text style={styles.sectionTitle}>رزنامة الالتزام</Text>
                            <View style={styles.perfectMonthBanner}>
                                <Text style={styles.perfectMonthBannerText}>
                                    🔥 تحدي الشهر: أكمل رزنامة الصلاة أو الكتاب المقدس بنسبة 100% هذا الشهر لتحصد 1000 نقطة إضافية لكل إنجاز!
                                </Text>
                            </View>
                            <View style={styles.calendarGrid}>
                                <Animated.View style={[styles.calendarCard, { opacity: prayerCardAnim, transform: [{ translateY: prayerCardAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: prayerCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
                                    <Text style={styles.calendarTitle}>سجل الالتزام بالصلاة</Text>
                                    <Text style={styles.calendarMonth}>{getCurrentMonth()}</Text>
                                    <View style={styles.calendarDays}>
                                        {prayerCalendar.map((active, index) => {
                                            const dayAnim = prayerDayAnims[index];
                                            return (
                                                <Animated.View
                                                    key={index}
                                                    style={[
                                                        styles.daySquare,
                                                        active ? styles.dayActive : styles.dayInactive,
                                                        active && dayAnim ? {
                                                            opacity: dayAnim,
                                                            transform: [{ scale: dayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }],
                                                        } : {},
                                                    ]}
                                                >
                                                    <Text style={styles.dayNumber}>{index + 1}</Text>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>
                                    <View style={styles.commitmentStatsRow}>
                                        <View style={styles.commitmentStat}>
                                            <Text style={styles.commitmentLabel}>عدد الأيام الملتزم بها</Text>
                                            <Text style={styles.commitmentValue}>{prayerTotal}</Text>
                                        </View>
                                        <View style={styles.commitmentStat}>
                                            <Text style={styles.commitmentLabel}>عدد الأيام غير الملتزم بها</Text>
                                            <Text style={styles.commitmentValue}>{prayerDays - prayerTotal}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressTrack}>
                                            <Animated.View style={[styles.progressFill, { width: prayerProgress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                                            <Animated.View
                                                style={[
                                                    styles.progressGlow,
                                                    { opacity: prayerGlow, transform: [{ scaleX: prayerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.progressLabel}>{prayerRate}%</Text>
                                    </View>
                                </Animated.View>
                                <Animated.View style={[styles.calendarCard, { opacity: bibleCardAnim, transform: [{ translateY: bibleCardAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: bibleCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
                                    <Text style={styles.calendarTitle}>سجل الالتزام بقراءة الكتاب المقدس</Text>
                                    <Text style={styles.calendarMonth}>{getCurrentMonth()}</Text>
                                    <View style={styles.calendarDays}>
                                        {bibleCalendar.map((active, index) => {
                                            const dayAnim = bibleDayAnims[index];
                                            return (
                                                <Animated.View
                                                    key={index}
                                                    style={[
                                                        styles.daySquare,
                                                        active ? styles.dayActive : styles.dayInactive,
                                                        active && dayAnim ? {
                                                            opacity: dayAnim,
                                                            transform: [{ scale: dayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }],
                                                        } : {},
                                                    ]}
                                                >
                                                    <Text style={styles.dayNumber}>{index + 1}</Text>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>
                                    <View style={styles.commitmentStatsRow}>
                                        <View style={styles.commitmentStat}>
                                            <Text style={styles.commitmentLabel}>عدد الأيام الملتزم بها</Text>
                                            <Text style={styles.commitmentValue}>{bibleTotal}</Text>
                                        </View>
                                        <View style={styles.commitmentStat}>
                                            <Text style={styles.commitmentLabel}>عدد الأيام غير الملتزم بها</Text>
                                            <Text style={styles.commitmentValue}>{bibleDays - bibleTotal}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressTrack}>
                                            <Animated.View style={[styles.progressFill, { width: bibleProgress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                                            <Animated.View
                                                style={[
                                                    styles.progressGlow,
                                                    { opacity: bibleGlow, transform: [{ scaleX: bibleGlow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.progressLabel}>{bibleRate}%</Text>
                                    </View>
                                </Animated.View>
                            </View>
                        </Animated.View>

                    </Animated.ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}