import { useRef, useEffect, useState } from 'react';
import { View, Image, Animated, Easing, Text, Modal, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import styles from './styles';
import CustomButton from '../../../components/CustomButton/CustomButton';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import SettingsButton from '../../../components/SettingsButton/SettingsButton';
import ConnectionButton from '../../../components/ConnectionButton/ConnectionButton';
import VerseComponent from '../../../components/VerseComponent/VerseComponent';


const dailyQuestion = {
    question: 'ما هو أول كتاب في العهد القديم؟',
    answers: ['تكوين', 'خروج', 'لاويين', 'عدد'],
    correctAnswer: 0,
};

export default function HomeScreen() {
    const moveAnim = useRef(new Animated.Value(0)).current;
    const statusFade = useRef(new Animated.Value(1)).current;
    const [modalVisible, setModalVisible] = useState(true);
    const [dailyAnswered, setDailyAnswered] = useState(false);
    const [dailyResult, setDailyResult] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('offline');
    const [isSheetVisible, setSheetVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(Date.now());
    const [pendingItems, setPendingItems] = useState(3);
    const bottomSheetAnim = useRef(new Animated.Value(300)).current;
    const sheetOpacity = useRef(new Animated.Value(0)).current;

    const formatRelativeTime = (timestamp) => {
        const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
        if (seconds < 60) return `قبل ${seconds} ثانية`;
        if (seconds < 3600) return `قبل ${Math.floor(seconds / 60)} دقيقة`;
        return `قبل ${Math.floor(seconds / 3600)} ساعة`;
    };

    const statusConfig = {
        online: {
            icon: 'check-circle',
            iconColor: '#2ecc71',
            title: '🟢 متصل',
            subtitle: 'تم تحديث جميع البيانات',
            cardStyle: styles.statusOnline,
        },
        pending: {
            icon: 'clock',
            iconColor: '#f1c40f',
            title: '🟡 يوجد بيانات بانتظار المزامنة',
            subtitle: 'سيتم إرسالها عند توفر الإنترنت.',
            cardStyle: styles.statusPending,
        },
        offline: {
            icon: 'times-circle',
            iconColor: '#e74c3c',
            title: '🔴 غير متصل بالإنترنت',
            subtitle: 'يتم حفظ جميع البيانات على الجهاز.',
            cardStyle: styles.statusOffline,
        },
    };

    const statusDetails = {
        online: `آخر مزامنة:\n${formatRelativeTime(lastSyncAt)}`,
        pending: `عمليات معلقة:\n${pendingItems}`,
        offline: 'سيتم رفعها تلقائياً عند الاتصال.',
    };

    const status = {
        ...statusConfig[connectionStatus],
        details: statusDetails[connectionStatus],
    };

    const connectionButtonStatus = {
        icon: connectionStatus === 'offline' ? 'wifi-off' : connectionStatus === 'pending' ? 'sync-alt' : 'cloud',
        iconColor: status.iconColor,
    };

    useEffect(() => {
        Animated.sequence([
            Animated.timing(statusFade, {
                toValue: 0.6,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(statusFade, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start();

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

        const updateConnection = (state) => {
            const isConnected = !!state.isConnected;
            const hasInternet = state.isInternetReachable !== false;
            const nextStatus = isConnected
                ? hasInternet
                    ? 'online'
                    : 'pending'
                : 'offline';

            setConnectionStatus(nextStatus);
            if (nextStatus === 'online') {
                setLastSyncAt(Date.now());
            }
        };

        const unsubscribe = NetInfo.addEventListener(updateConnection);
        NetInfo.fetch().then(updateConnection);
        return unsubscribe;
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        NetInfo.fetch()
            .then((state) => {
                const isConnected = !!state.isConnected;
                const hasInternet = state.isInternetReachable !== false;
                const nextStatus = isConnected
                    ? hasInternet
                        ? 'online'
                        : 'pending'
                    : 'offline';

                setConnectionStatus(nextStatus);
                if (nextStatus === 'online') {
                    setLastSyncAt(Date.now());
                }
            })
            .finally(() => setRefreshing(false));
    };

    const showBottomSheet = () => {
        setSheetVisible(true);
        Animated.parallel([
            Animated.timing(sheetOpacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(bottomSheetAnim, {
                toValue: 0,
                duration: 240,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const hideBottomSheet = () => {
        Animated.parallel([
            Animated.timing(sheetOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(bottomSheetAnim, {
                toValue: 300,
                duration: 240,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(() => setSheetVisible(false));
    };

    const handleDailyAnswer = (index) => {
        if (dailyAnswered) return;
        const isCorrect = index === dailyQuestion.correctAnswer;
        setDailyResult(isCorrect ? 'correct' : 'wrong');
        setDailyAnswered(true);

        setTimeout(() => {
            setModalVisible(false);
        }, 800);
    };

    return (
        <View style={styles.container}>
            <ConnectionButton onPress={showBottomSheet} status={connectionButtonStatus} />
            <SettingsButton />
            <VerseComponent />
            <Text style={styles.text}>سيزار فريج</Text>
            <CustomButton />

            <Image
                source={require('../../../assets/images/st-seraphim.png')}
                style={styles.icon}
                resizeMode="cover"
            />
            <Animated.View style={{ width: '3000', height: '100%', position: 'absolute', bottom: -100, left: 0 }}>
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

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => {}}>
                <View style={styles.dailyModalOverlay}>
                    <View style={styles.dailyModalCard}>
                        <Text style={styles.dailyModalTitle}>سؤال اليوم</Text>
                        <Text style={styles.dailyQuestionText}>{dailyQuestion.question}</Text>

                        {dailyQuestion.answers.map((answer, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.dailyAnswerOption}
                                activeOpacity={0.8}
                                onPress={() => handleDailyAnswer(index)}
                            >
                                <Text style={styles.dailyAnswerText}>{answer}</Text>
                            </TouchableOpacity>
                        ))}

                        {dailyResult === 'correct' && (
                            <View style={[styles.dailyResultBox, styles.dailyResultSuccess]}>
                                <Text style={styles.dailyResultText}>أحسنت 🎉</Text>
                                <Text style={styles.dailyResultSubText}>+5 نقاط</Text>
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

            <Modal visible={isSheetVisible} transparent animationType="none" onRequestClose={hideBottomSheet}>
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={hideBottomSheet} />
                    <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: bottomSheetAnim }], opacity: sheetOpacity }]}> 
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>حالة الاتصال</Text>
                        <View style={styles.statusHeader}>
                            <FontAwesome5 name={status.icon} size={20} color={status.iconColor} />
                            <Text style={styles.statusTitle}>{status.title}</Text>
                        </View>
                        <Text style={[styles.sheetText, styles.sheetDescription]}>{status.subtitle}</Text>
                        <Text style={styles.sheetText}>{status.details}</Text>
                        <TouchableOpacity style={styles.sheetButton} activeOpacity={0.8} onPress={handleRefresh}>
                            <Text style={styles.sheetButtonText}>تحديث الآن</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}