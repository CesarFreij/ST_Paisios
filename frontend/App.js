import 'react-native-gesture-handler';
import HomeScreen from './src/screens/main/HomeScreen/HomeScreen';
import PointsScreen from './src/screens/main/PointsScreen/PointsScreen';
import RankScreen from './src/screens/main/RankScreen/RankScreen';
import WeeklyExam from './src/screens/main/WeeklyExam/WeeklyExam';
import ActiveQuizScreen from './src/screens/main/Quizzes/ActiveQuizScreen';
import AchievementsScreen from './src/screens/main/Achievements/AchievementsScreen';
import Quiz from './src/screens/main/Quiz/Quiz';
import QuizResult from './src/screens/main/QuizResult/QuizResult';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StatusBar, View } from 'react-native';
import LoginRegister from './src/screens/auth/LoginRegister';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import OfflineBanner from './src/components/OfflineBanner/OfflineBanner';
import authService from './src/services/authService';
import { UserPointsProvider } from './src/context/UserPointsContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const [fontsLoaded, fontError] = useFonts(Platform.OS === 'web' ? {
    ...FontAwesome.font,
    ...FontAwesome5.font,
    ...FontAwesome6.font,
    ...Ionicons.font,
  } : {});
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const shouldNavigateToHome = useRef(false);

  const navigateToHomeIfReady = useCallback(() => {
    if (shouldNavigateToHome.current && navigationRef.isReady()) {
      shouldNavigateToHome.current = false;
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkSavedToken = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (isMounted && user) {
          shouldNavigateToHome.current = true;
          navigateToHomeIfReady();
        }
      } catch (error) {
        console.error('Failed to check the saved authentication token:', error);
      } finally {
        if (isMounted) {
          setIsCheckingToken(false);
        }
      }
    };

    checkSavedToken();
    return () => {
      isMounted = false;
    };
  }, [navigateToHomeIfReady]);

  if (fontError) {
    throw fontError;
  }
  if (Platform.OS === 'web' && !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <UserPointsProvider>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <NavigationContainer ref={navigationRef} onReady={navigateToHomeIfReady}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar backgroundColor="#000000" barStyle="light-content" />
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#000000' }}>
              <Stack.Navigator
                initialRouteName="LoginRegister"
                screenOptions={{ headerShown: false, animation: 'slide_from_left' }}
              >
                <Stack.Screen name="LoginRegister">
                  {(props) => <LoginRegister {...props} isCheckingToken={isCheckingToken} />}
                </Stack.Screen>
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
          </View>
        </NavigationContainer>
        <OfflineBanner />
      </View>
      </UserPointsProvider>
    </SafeAreaProvider>
  );
}