import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatArabicPoints } from '../../utils/formatArabicPoints';

const CONFETTI_COLORS = ['#10b981', '#38bdf8', '#53b6a8', '#7c6ee6', '#e85d75', '#86efac'];
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    size: 7 + (index % 4),
    rotation: `${(index % 2 ? 1 : -1) * (180 + index * 11)}deg`,
}));

export default function PointNotificationModal({ visible, points, onClose }) {
    const isPositive = points > 0;
    const amount = formatArabicPoints(Math.abs(points));
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.88)).current;
    const shake = useRef(new Animated.Value(0)).current;
    const confetti = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
    const closingRef = useRef(false);

    useEffect(() => {
        if (!visible) return undefined;

        closingRef.current = false;
        opacity.setValue(0);
        scale.setValue(0.88);
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: true,
            }),
        ]).start();

        if (isPositive) {
            confetti.forEach((particle) => particle.setValue(0));
            Animated.stagger(
                35,
                confetti.map((particle) => Animated.timing(particle, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }))
            ).start();
        } else {
            shake.setValue(0);
            Animated.sequence([
                Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
                Animated.timing(shake, { toValue: -1, duration: 75, useNativeDriver: true }),
                Animated.timing(shake, { toValue: 0.7, duration: 65, useNativeDriver: true }),
                Animated.timing(shake, { toValue: -0.7, duration: 65, useNativeDriver: true }),
                Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
            ]).start();
        }

        return () => {
            opacity.stopAnimation();
            scale.stopAnimation();
            shake.stopAnimation();
            confetti.forEach((particle) => particle.stopAnimation());
        };
    }, [visible, isPositive, opacity, scale, shake, confetti]);

    const close = () => {
        if (closingRef.current) return;
        closingRef.current = true;
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 160,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.92,
                duration: 160,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) onClose();
        });
    };

    const translateX = shake.interpolate({
        inputRange: [-1, 1],
        outputRange: [-9, 9],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={close}
        >
            <View style={styles.overlay}>
                {isPositive && (
                    <View pointerEvents="none" style={styles.confettiLayer}>
                        {CONFETTI_PARTICLES.map((particle, index) => {
                            const progress = confetti[index];
                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.confettiParticle,
                                        {
                                            left: particle.left,
                                            width: particle.size,
                                            height: particle.size * 1.5,
                                            backgroundColor: particle.color,
                                            opacity: progress.interpolate({
                                                inputRange: [0, 0.15, 1],
                                                outputRange: [0, 1, 0],
                                            }),
                                            transform: [
                                                {
                                                    translateY: progress.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, 430],
                                                    }),
                                                },
                                                {
                                                    rotate: progress.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ['0deg', particle.rotation],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                />
                            );
                        })}
                    </View>
                )}
                <Animated.View
                    accessibilityRole="alert"
                    accessibilityViewIsModal
                    style={[
                        styles.card,
                        isPositive ? styles.positiveCard : styles.negativeCard,
                        {
                            opacity,
                            transform: [{ scale }, { translateX }],
                        },
                    ]}
                >
                    <View style={[styles.iconCircle, isPositive ? styles.positiveIcon : styles.negativeIcon]}>
                        <Text style={styles.icon}>{isPositive ? '🎉' : '⚠️'}</Text>
                    </View>
                    <Text style={[styles.title, isPositive ? styles.positiveText : styles.negativeText]}>
                        {isPositive ? 'مبروك!' : 'تنبيه خصم نقاط'}
                    </Text>
                    <Text style={styles.message}>
                        {isPositive ? `+${amount}` : `-${amount}`}
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        style={[styles.closeButton, isPositive ? styles.positiveButton : styles.negativeButton]}
                        activeOpacity={0.85}
                        onPress={close}
                    >
                        <Text style={styles.closeButtonText}>{isPositive ? 'حسناً' : 'متابعة'}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(3, 7, 18, 0.78)',
    },
    confettiLayer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    confettiParticle: {
        position: 'absolute',
        top: -18,
        borderRadius: 3,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        alignItems: 'center',
        paddingHorizontal: 26,
        paddingTop: 30,
        paddingBottom: 24,
        borderRadius: 28,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 14,
    },
    positiveCard: {
        borderColor: '#10B981',
        shadowColor: '#10B981',
        backgroundColor: '#10291f',
    },
    negativeCard: {
        borderColor: '#EF4444',
        shadowColor: '#EF4444',
        backgroundColor: '#2d1b19',
    },
    iconCircle: {
        width: 82,
        height: 82,
        marginBottom: 16,
        borderRadius: 41,
        alignItems: 'center',
        justifyContent: 'center',
    },
    positiveIcon: {
        backgroundColor: '#174b35',
    },
    negativeIcon: {
        backgroundColor: '#512b20',
    },
    icon: {
        fontSize: 44,
        textAlign: 'center',
    },
    title: {
        marginBottom: 12,
        fontSize: 25,
        fontWeight: '800',
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    positiveText: {
        color: '#6ee7b7',
    },
    negativeText: {
        color: '#fdba74',
    },
    message: {
        marginBottom: 22,
        color: '#f3f4f6',
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 34,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    closeButton: {
        width: '100%',
        minHeight: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    positiveButton: {
        backgroundColor: '#15803d',
    },
    negativeButton: {
        backgroundColor: '#EF4444',
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        writingDirection: 'rtl',
    },
});
