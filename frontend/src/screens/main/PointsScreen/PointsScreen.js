import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Easing, View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import styles from './styles';

const pointsData = [
    { id: 'prayer', title: '🙏 الصلاة', count: 25, points: 125 },
    { id: 'bible', title: '📖 قراءة الكتاب المقدس', count: 18, points: 90 },
    { id: 'church', title: '⛪ الذهاب إلى الكنيسة', count: 12, points: 60 },
    { id: 'invite', title: '🤝 دعوة صديق', count: 8, points: 40 },
    { id: 'good', title: '❤️ عمل الخير', count: 20, points: 100 },
];

const prayerCalendar = [
    true, true, false, true, true, true, false, true, true, true,
    true, false, true, true, true, true, false, true, true, true,
    true, true, true, false, true, true, true, true, false, true,
];

const bibleCalendar = [
    true, true, true, true, false, true, true, false, true, true,
    true, true, false, true, true, true, true, true, false, true,
    true, false, true, true, true, true, true, false, true, true,
];

const userData = {
    name: 'سيزار فريج',
    rank: '#12',
    streak: 14,
};

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function PointsScreen() {
    const navigation = useNavigation();
    const [buttonScale] = useState(new Animated.Value(1));
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const totalPointsValue = useRef(new Animated.Value(0)).current;
    const totalTasksValue = useRef(new Animated.Value(0)).current;

    const prayerCardAnim = useRef(new Animated.Value(0)).current;
    const bibleCardAnim = useRef(new Animated.Value(0)).current;
    const prayerProgress = useRef(new Animated.Value(0)).current;
    const bibleProgress = useRef(new Animated.Value(0)).current;
    const prayerPercent = useRef(new Animated.Value(0)).current;
    const biblePercent = useRef(new Animated.Value(0)).current;
    const prayerGlow = useRef(new Animated.Value(0)).current;
    const bibleGlow = useRef(new Animated.Value(0)).current;
    const prayerDayAnims = useRef(prayerCalendar.map((active) => new Animated.Value(active ? 0 : 1))).current;
    const bibleDayAnims = useRef(bibleCalendar.map((active) => new Animated.Value(active ? 0 : 1))).current;

    const totalPoints = useMemo(() => pointsData.reduce((sum, item) => sum + item.points, 0), []);
    const totalTasks = useMemo(() => pointsData.reduce((sum, item) => sum + item.count, 0), []);
    const mostActivity = useMemo(() => pointsData.reduce((best, item) => (item.count > best.count ? item : best), pointsData[0]), []);
    const leastActivity = useMemo(() => pointsData.reduce((worst, item) => (item.count < worst.count ? item : worst), pointsData[0]), []);

    const prayerTotal = useMemo(() => prayerCalendar.filter(Boolean).length, []);
    const bibleTotal = useMemo(() => bibleCalendar.filter(Boolean).length, []);
    const prayerDays = prayerCalendar.length;
    const bibleDays = bibleCalendar.length;
    const prayerRate = Math.round((prayerTotal / prayerDays) * 100);
    const bibleRate = Math.round((bibleTotal / bibleDays) * 100);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        Animated.timing(totalPointsValue, {
            toValue: totalPoints,
            duration: 1200,
            useNativeDriver: false,
        }).start();

        Animated.timing(totalTasksValue, {
            toValue: totalTasks,
            duration: 1200,
            useNativeDriver: false,
        }).start();
    }, []);

    useFocusEffect(
        useCallback(() => {
            prayerCardAnim.setValue(0);
            bibleCardAnim.setValue(0);
            prayerProgress.setValue(0);
            bibleProgress.setValue(0);
            prayerPercent.setValue(0);
            biblePercent.setValue(0);
            prayerGlow.setValue(0);
            bibleGlow.setValue(0);

            prayerDayAnims.forEach((anim, index) => {
                if (prayerCalendar[index]) {
                    anim.setValue(0);
                }
            });
            bibleDayAnims.forEach((anim, index) => {
                if (bibleCalendar[index]) {
                    anim.setValue(0);
                }
            });

            Animated.parallel([
                Animated.timing(prayerCardAnim, {
                    toValue: 1,
                    duration: 550,
                    delay: 160,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(bibleCardAnim, {
                    toValue: 1,
                    duration: 550,
                    delay: 320,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(prayerProgress, {
                    toValue: prayerRate,
                    duration: 1200,
                    delay: 120,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(bibleProgress, {
                    toValue: bibleRate,
                    duration: 1200,
                    delay: 240,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(prayerPercent, {
                    toValue: prayerRate,
                    duration: 1200,
                    delay: 120,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(biblePercent, {
                    toValue: bibleRate,
                    duration: 1200,
                    delay: 240,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(prayerGlow, {
                    toValue: 1,
                    duration: 1200,
                    delay: 120,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(bibleGlow, {
                    toValue: 1,
                    duration: 1200,
                    delay: 240,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ]).start();

            Animated.stagger(
                26,
                prayerCalendar.map((active, index) =>
                    active
                        ? Animated.timing(prayerDayAnims[index], {
                              toValue: 1,
                              duration: 360,
                              delay: 240 + index * 8,
                              easing: Easing.out(Easing.ease),
                              useNativeDriver: true,
                          })
                        : Animated.delay(0),
                ),
            ).start();

            Animated.stagger(
                26,
                bibleCalendar.map((active, index) =>
                    active
                        ? Animated.timing(bibleDayAnims[index], {
                              toValue: 1,
                              duration: 360,
                              delay: 320 + index * 8,
                              easing: Easing.out(Easing.ease),
                              useNativeDriver: true,
                          })
                        : Animated.delay(0),
                ),
            ).start();
        }, [prayerRate, bibleRate]),
    );

    const animatedTotalPoints = totalPointsValue.interpolate({
        inputRange: [0, totalPoints],
        outputRange: [0, totalPoints],
    });

    const animatedTotalTasks = totalTasksValue.interpolate({
        inputRange: [0, totalTasks],
        outputRange: [0, totalTasks],
    });

    const getCurrentMonth = () => {
        const date = new Date();
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
                    <Text style={styles.backText}>رجوع</Text>
                </TouchableOpacity>
                <Text style={styles.title}>نقاطي</Text>
            </View>

            <Animated.ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                style={{ opacity: fadeAnim }}
            >
                <Animated.View style={[styles.premiumCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <View style={styles.gradientOverlay} />
                    <View style={styles.premiumHeader}>
                        <Text style={styles.premiumTag}>حساب بريميوم</Text>
                        <FontAwesome5 name="user-circle" size={28} color="rgba(255,255,255,0.9)" />
                    </View>
                    <Text style={styles.userName}>{userData.name}</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>⭐ النقاط الكلية</Text>
                            <Animated.Text style={styles.summaryValue}>{animatedTotalPoints}</Animated.Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>🏆 الرتبة الحالية</Text>
                            <Text style={styles.summaryValue}>{userData.rank}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>🔥 الأيام المتتالية</Text>
                            <Text style={styles.summaryValue}>{userData.streak} يوم</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>تفاصيل النقاط</Text>
                    {pointsData.map((item) => (
                        <View key={item.id} style={styles.detailItem}>
                            <View style={styles.detailHeader}>
                                <Text style={styles.detailTitle}>{item.title}</Text>
                                <Text style={styles.detailPoints}>{item.points} نقطة</Text>
                            </View>
                            <View style={styles.detailMeta}>
                                <Text style={styles.detailMetaText}>عدد المرات: {item.count} مرة</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>إحصائيات</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statsBox}>
                            <Text style={styles.statsLabel}>إجمالي الأعمال المنجزة</Text>
                            <Animated.Text style={styles.statsValue}>{animatedTotalTasks}</Animated.Text>
                        </View>
                        <View style={styles.statsBox}>
                            <Text style={styles.statsLabel}>إجمالي النقاط</Text>
                            <Animated.Text style={styles.statsValue}>{animatedTotalPoints}</Animated.Text>
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
                                                active && {
                                                    opacity: dayAnim,
                                                    transform: [
                                                        { scale: dayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) },
                                                    ],
                                                },
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
                                            {
                                                opacity: prayerGlow,
                                                transform: [
                                                    { scaleX: prayerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                                                ],
                                            },
                                        ]}
                                    />
                                </View>
                                <Animated.Text style={styles.progressLabel}>{prayerPercent.interpolate({ inputRange: [0, 100], outputRange: ['0%', `${prayerRate}%`] })}</Animated.Text>
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
                                                active && {
                                                    opacity: dayAnim,
                                                    transform: [
                                                        { scale: dayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) },
                                                    ],
                                                },
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
                                            {
                                                opacity: bibleGlow,
                                                transform: [
                                                    { scaleX: bibleGlow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                                                ],
                                            },
                                        ]}
                                    />
                                </View>
                                <Animated.Text style={styles.progressLabel}>{biblePercent.interpolate({ inputRange: [0, 100], outputRange: ['0%', `${bibleRate}%`] })}</Animated.Text>
                            </View>
                        </Animated.View>
                    </View>
                </Animated.View>

            </Animated.ScrollView>
        </SafeAreaView>
    );
}
