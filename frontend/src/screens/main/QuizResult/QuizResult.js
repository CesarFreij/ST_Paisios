import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import styles from './styles';

export default function QuizResult() {
  const navigation = useNavigation();
  const route = useRoute();
  const questions = route.params?.questions ?? [];
  const answers = route.params?.answers ?? [];

  const correctCount = questions.filter((question, index) => question.correctAnswer === answers[index]).length;
  const wrongCount = questions.length - correctCount;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const finalMark = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const getMessage = () => {
    if (percentage >= 80) return 'أحسنت! استمر هكذا.';
    if (percentage >= 50) return 'عمل جيد! حاول أن تحسن نتيجتك.';
    return 'لا بأس، سنحاول مرة أخرى الأسبوع القادم.';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
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

      <Text style={styles.noteText}>سيتم إضافة النقاط عند ربط التطبيق بلوحة التحكم.</Text>

      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
        <Text style={styles.homeButtonText}>العودة للرئيسية</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
