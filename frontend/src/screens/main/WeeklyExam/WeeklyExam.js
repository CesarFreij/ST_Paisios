import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import styles from './styles';

const weeklyExam = {
  available: true,
  title: 'اختبار الأسبوع الأول',
  questions: [
    { question: 'ما هو اسم الكتاب السماوي الذي يحتوي على الإنجيل؟', answers: ['التوراة', 'الزبور', 'القرآن', 'الإنجيل'], correctAnswer: 3 },
    { question: 'من هو الرسول الذي كتب رسالة إلى أهل كورنثوس؟', answers: ['بطرس', 'متى', 'بولس', 'يوحنا'], correctAnswer: 2 },
    { question: 'ما هو عدد الأناجيل في العهد الجديد؟', answers: ['3', '4', '5', '6'], correctAnswer: 1 },
  ],
  totalMark: 100,
};

export default function WeeklyExam() {
  const navigation = useNavigation();
  const questionCount = weeklyExam.questions.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>الاختبارات الأسبوعية</Text>
      </View>

      <View style={styles.descriptionCard}>
        <Text style={styles.descriptionText}>
          كل يوم جمعة سيتم إضافة اختبار جديد لمراجعة درس هذا الأسبوع.
        </Text>
      </View>

      {weeklyExam.available ? (
        <View style={styles.examCard}>
          <Text style={styles.examLabel}>اسم الاختبار</Text>
          <Text style={styles.examTitle}>{weeklyExam.title}</Text>
          <View style={styles.examStatsRow}>
            <View style={styles.examStatItem}>
              <Text style={styles.statLabel}>عدد الأسئلة</Text>
              <Text style={styles.statValue}>{questionCount}</Text>
            </View>
            <View style={styles.examStatItem}>
              <Text style={styles.statLabel}>العلامة الكاملة</Text>
              <Text style={styles.statValue}>{weeklyExam.totalMark}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Quiz', { questions: weeklyExam.questions, title: weeklyExam.title })}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>ابدأ الاختبار</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.examCard, styles.disabledCard]}>
          <Text style={styles.disabledText}>لا يوجد اختبار لهذا الأسبوع</Text>
          <TouchableOpacity style={[styles.startButton, styles.startButtonDisabled]} disabled>
            <Text style={styles.startButtonText}>ابدأ الاختبار</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
