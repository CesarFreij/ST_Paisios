import 'react-native-gesture-handler';
import HomeScreen from './src/screens/main/HomeScreen/HomeScreen';
import PointsScreen from './src/screens/main/PointsScreen/PointsScreen';
import RankScreen from './src/screens/main/RankScreen/RankScreen';
import WeeklyExam from './src/screens/main/WeeklyExam/WeeklyExam';
import ActiveQuizScreen from './src/screens/main/Quizzes/ActiveQuizScreen';
import AchievementsScreen from './src/screens/main/Achievements/AchievementsScreen';
import Quiz from './src/screens/main/Quiz/Quiz';
import QuizResult from './src/screens/main/QuizResult/QuizResult';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginRegister from './src/screens/auth/LoginRegister';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import OfflineBanner from './src/components/OfflineBanner/OfflineBanner';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="LoginRegister"
              screenOptions={{ headerShown: false, animation: 'slide_from_left' }}
            >
              <Stack.Screen name="LoginRegister" component={LoginRegister} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Points" component={PointsScreen} />
              <Stack.Screen name="Rank" component={RankScreen} />
              <Stack.Screen name="WeeklyExam" component={WeeklyExam} />
              <Stack.Screen name="ActiveQuiz" component={ActiveQuizScreen} />
              <Stack.Screen name="Achievements" component={AchievementsScreen} />
              <Stack.Screen name="Quiz" component={Quiz} />
              <Stack.Screen name="QuizResult" component={QuizResult} />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
        <OfflineBanner />
      </View>
    </SafeAreaProvider>
  );
}