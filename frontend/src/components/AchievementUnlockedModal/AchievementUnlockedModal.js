import { useEffect, useRef } from 'react'
import { Animated, Easing, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { formatArabicPoints } from '../../utils/formatArabicPoints'

const confettiColors = ['#10b981', '#38bdf8', '#53b6a8', '#7c6ee6', '#e85d75', '#86efac']
const confettiParticles = Array.from({ length: 24 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    color: confettiColors[index % confettiColors.length],
    size: 7 + (index % 4),
    rotation: `${(index % 2 ? 1 : -1) * (180 + index * 11)}deg`,
}))

export default function AchievementUnlockedModal({ achievements, onClose }) {
    const visible = Array.isArray(achievements) && achievements.length > 0
    const opacity = useRef(new Animated.Value(0)).current
    const scale = useRef(new Animated.Value(0.88)).current
    const confetti = useRef(confettiParticles.map(() => new Animated.Value(0))).current

    useEffect(() => {
        if (!visible) return undefined

        opacity.setValue(0)
        scale.setValue(0.88)
        confetti.forEach((particle) => particle.setValue(0))
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.stagger(
                30,
                confetti.map((particle) => Animated.timing(particle, {
                    toValue: 1,
                    duration: 1400,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: Platform.OS !== 'web',
                }))
            ),
        ]).start()

        return () => {
            opacity.stopAnimation()
            scale.stopAnimation()
            confetti.forEach((particle) => particle.stopAnimation())
        }
    }, [visible, achievements, opacity, scale, confetti])

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.confettiLayer}>
                    {confettiParticles.map((particle, index) => {
                        const progress = confetti[index]
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
                        )
                    })}
                </View>
                <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
                    <Text style={styles.emoji}>🎉</Text>
                    <Text style={styles.title}>تهانينا! إنجاز جديد</Text>
                    {achievements?.map((achievement, index) => (
                        <View key={`${achievement.achievementId}-${achievement.level}-${index}`} style={styles.achievement}>
                            <Text style={styles.name}>{achievement.name}</Text>
                            <Text style={styles.reward}>
                                أضيفت {formatArabicPoints(achievement.points)} إلى رصيدك
                            </Text>
                        </View>
                    ))}
                    <TouchableOpacity
                        accessibilityRole="button"
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.closeButtonText}>رائع!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(3, 7, 18, 0.72)',
    },
    confettiLayer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    confettiParticle: {
        position: 'absolute',
        top: 0,
        borderRadius: 2,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        padding: 24,
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#38bdf8',
        backgroundColor: '#f0fdf9',
        elevation: 12,
    },
    emoji: { fontSize: 42, marginBottom: 8 },
    title: {
        color: '#047857',
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 14,
    },
    achievement: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#a7f3d0',
        alignItems: 'center',
    },
    name: {
        color: '#162d50',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    reward: {
        color: '#047857',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 5,
    },
    closeButton: {
        minWidth: 140,
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        backgroundColor: '#059669',
        alignItems: 'center',
    },
    closeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
})
