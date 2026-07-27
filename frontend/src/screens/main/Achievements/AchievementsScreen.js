import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import styles from './styles';

const achievementsData = [
  {
    id: 'prayer-streak',
    icon: 'praying-hands',
    title: '🙏 محافظ على الصلاة',
    description: 'صلِّ لمدة 10 أيام متتالية',
    reward: 100,
    progress: 7,
    target: 10,
    locked: false,
  },
  {
    id: 'bible-reader',
    icon: 'book-open',
    title: '📖 قارئ الكتاب المقدس',
    description: 'اقرأ الكتاب المقدس لمدة 15 يوماً',
    reward: 150,
    progress: 10,
    target: 15,
    locked: false,
  },
  {
    id: 'church-member',
    icon: 'church',
    title: '⛪ ابن الكنيسة',
    description: 'احضر الكنيسة 8 مرات',
    reward: 120,
    progress: 5,
    target: 8,
    locked: false,
  },
  {
    id: 'messenger',
    icon: 'hand-holding-heart',
    title: '🤝 مرسل',
    description: 'ادعُ 5 أصدقاء',
    reward: 200,
    progress: 2,
    target: 5,
    locked: false,
  },
  {
    id: 'good-deed',
    icon: 'heart',
    title: '❤️ صانع الخير',
    description: 'قم بـ 20 عمل خير',
    reward: 250,
    progress: 13,
    target: 20,
    locked: false,
  },
];

const titlesData = [
  { id: 'beginner', label: '🌱 مبتدئ', points: 0 },
  { id: 'student', label: '⭐ تلميذ', points: 300 },
  { id: 'server', label: '🔥 خادم', points: 700 },
  { id: 'trustee', label: '👑 أمين', points: 1500 },
  { id: 'role-model', label: '🏆 قدوة', points: 3000 },
];

const activeTitleId = 'server';

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const cardAnims = useRef(achievementsData.map(() => new Animated.Value(0))).current;
  const progressAnims = useRef(achievementsData.map(() => new Animated.Value(0))).current;
  const scaleAnims = useRef(achievementsData.map(() => new Animated.Value(1))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeTitle = useMemo(
    () => titlesData.find((title) => title.id === activeTitleId) ?? titlesData[0],
    [],
  );

  useEffect(() => {
    Animated.stagger(
      120,
      achievementsData.map((item, index) =>
        Animated.parallel([
          Animated.timing(cardAnims[index], {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(progressAnims[index], {
            toValue: Math.min(100, (item.progress / item.target) * 100),
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handlePressIn = (index) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const handlePressOut = (index) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>الإنجازات والألقاب</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>الإنجازات</Text>
        {achievementsData.map((item, index) => {
          const progressRatio = Math.min(1, item.progress / item.target);
          const isComplete = item.progress >= item.target;
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.achievementCard,
                {
                  opacity: cardAnims[index],
                  transform: [
                    { translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                    { scale: scaleAnims[index] },
                  ],
                },
                item.locked && styles.lockedCard,
                isComplete && styles.completeCard,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                style={styles.achievementTouchable}
              >
                <View style={styles.achievementHeader}>
                  <View style={styles.achievementIconWrapper}>
                    <FontAwesome5 name={item.icon} size={22} color={isComplete ? '#27ae60' : '#348cb2'} />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{item.title}</Text>
                    <Text style={styles.achievementDescription}>{item.description}</Text>
                  </View>
                  {isComplete ? (
                    <Animated.View style={styles.checkBadge}>
                      <FontAwesome5 name="check" size={14} color="white" />
                    </Animated.View>
                  ) : null}
                </View>

                <View style={styles.rewardRow}>
                  <Text style={styles.rewardLabel}>المكافأة</Text>
                  <Text style={styles.rewardValue}>{item.reward} نقطة</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>Progress</Text>
                  <Text style={styles.progressText}>{item.progress} / {item.target}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnims[index].interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercentage}>{Math.round(progressRatio * 100)}%</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>الألقاب</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.titlesRow}>
          {titlesData.map((item) => {
            const isActive = item.id === activeTitleId;
            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.titleCard,
                  isActive && styles.titleCardActive,
                  isActive && {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Text style={styles.titleLabel}>{item.label}</Text>
                <Text style={styles.titlePoints}>{item.points} نقطة</Text>
                {isActive && (
                  <View style={styles.crownBadge}>
                    <FontAwesome5 name="crown" size={14} color="#f1c40f" />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </ScrollView>

        <View style={styles.currentBadge}>
          <Text style={styles.currentLabel}>لقبك الحالي</Text>
          <Text style={styles.currentTitle}>{activeTitle.label.replace('🔥 ', '')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
