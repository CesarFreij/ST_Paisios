import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import styles from './styles';

const defaultQuestions = [
  {
    question: 'ما هو الكتاب الذي يحتوي على العهد القديم؟',
    answers: ['الإنجيل', 'التوراة', 'الزبور', 'الرسائل'],
    correctAnswer: 1,
  },
  {
    question: 'من هو الرسول الذي كتب رسالة إلى أهل رومية؟',
    answers: ['بطرس', 'يوحنا', 'بولس', 'متى'],
    correctAnswer: 2,
  },
  {
    question: 'كم عدد أيام الخلق حسب الكتاب المقدس؟',
    answers: ['5', '6', '7', '8'],
    correctAnswer: 1,
  },
  {
    question: 'ما هي أول كلمة في الإنجيل حسب لوقا؟',
    answers: ['في البدء', 'وكان', 'وهكذا', 'لذلك'],
    correctAnswer: 1,
  },
];

export default function Quiz() {
  const navigation = useNavigation();
  const route = useRoute();
  const questions = route.params?.questions ?? defaultQuestions;
  const title = route.params?.title ?? 'الاختبار الأسبوعي';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectAnswer = (index) => {
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = index;
    setAnswers(nextAnswers);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    if (isLastQuestion) {
      navigation.navigate('QuizResult', { questions, answers });
      return;
    }
    setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.questionCounter}>السؤال {currentIndex + 1} من {questions.length}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        <FlatList
          data={currentQuestion.answers}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.answerOption,
                selectedAnswer === index && styles.answerOptionSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectAnswer(index)}
            >
              <Text style={[styles.answerText, selectedAnswer === index && styles.answerTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.footerButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>السابق</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, selectedAnswer === null && styles.navButtonDisabled]}
          onPress={handleNext}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.navButtonText}>{isLastQuestion ? 'إنهاء الاختبار' : 'التالي'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
