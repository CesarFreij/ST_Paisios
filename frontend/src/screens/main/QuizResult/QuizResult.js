import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../api/apiClient';
import styles from './styles';

export default function QuizResult() {
  const navigation = useNavigation();
  const route = useRoute();
  const questions = route.params?.questions ?? [];
  const answers = route.params?.answers ?? [];
  const quizType = route.params?.quizType;
  const quizId = route.params?.quizId;
  const submissionAttempted = useRef(false);
  const [submissionMessage, setSubmissionMessage] = useState(
    ['daily', 'weekly'].includes(quizType) && quizId
      ? 'جارٍ حفظ نتيجتك...'
      : 'لم يتم حفظ النتيجة؛ هذا الاختبار غير مرتبط بسجل على الخادم.'
  );
  const returnToQuizzes = useCallback(() => {
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'WeeklyExam' }],
    });
  }, [navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      returnToQuizzes();
      return true;
    });
    return () => backHandler.remove();
  }, [returnToQuizzes]);

  const correctCount = questions.filter((question, index) => (question.correctOptionIndex ?? question.correctAnswer) === answers[index]).length;
  const wrongCount = questions.length - correctCount;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const finalMark = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  useEffect(() => {
    if (submissionAttempted.current || !['daily', 'weekly'].includes(quizType) || !quizId) return;
    submissionAttempted.current = true;

    api.post('/api/quiz-submissions', { quizType, quizId, answers })
      .then(() => setSubmissionMessage('تم حفظ نتيجتك بنجاح.'))
      .catch(() => setSubmissionMessage('تعذر حفظ نتيجتك. تحقق من اتصال الإنترنت ثم أعد المحاولة لاحقًا.'));
  }, [answers, quizId, quizType]);

  const getMessage = () => {
    if (percentage >= 80) return 'أحسنت! استمر هكذا.';
    if (percentage >= 50) return 'عمل جيد! حاول أن تحسن نتيجتك.';
    return 'لا بأس، سنحاول مرة أخرى الأسبوع القادم.';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={returnToQuizzes}>
          <FontAwesome5 name="chevron-right" size={20} color="#348cb2" />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>نتيجة الاختبار</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>عدد الإجابات الصحيحة</Text>
        <Text style={styles.resultValue}>{correctCount}</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>عدد الإجابات الخاطئة</Text>
        <Text style={styles.resultValue}>{wrongCount}</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>العلامة النهائية</Text>
        <Text style={styles.resultValue}>{finalMark}%</Text>
      </View>

      <View style={styles.resultCard}> 
        <Text style={styles.resultLabel}>نسبة النجاح</Text>
        <Text style={styles.resultValue}>{percentage}%</Text>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageText}>{getMessage()}</Text>
      </View>

      <Text style={styles.noteText}>{submissionMessage}</Text>

      <TouchableOpacity style={styles.homeButton} onPress={returnToQuizzes} activeOpacity={0.8}>
        <Text style={styles.homeButtonText}>العودة إلى الاختبارات</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
