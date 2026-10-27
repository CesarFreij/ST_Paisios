import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Image } from 'react-native'
import React, { useState, useRef } from 'react'
import styles from './styles'
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import authService from '../../services/authService'
import showAlert from '../../utils/showAlert'

const { height } = Dimensions.get('window');

export default function LoginRegister({ isCheckingToken = false }) {
    const navigation = useNavigation();
    const [usernameLogin, setUsernameLogin] = useState('');
    const [passwordLogin, setPasswordLogin] = useState('');
    const [usernameRegister, setUsernameRegister] = useState('');
    const [passwordRegister, setPasswordRegister] = useState('');
    const [confirmPasswordRegister, setConfirmPasswordRegister] = useState('');
    const [showLogin, setShowLogin] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);

    const handleLogin = async () => {
        if (!usernameLogin.trim() || !passwordLogin.trim()) {
            setLoginError('يرجى ملء جميع الحقول المطلوبة');
            showAlert('حقل مطلوب', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setLoginError('');
        setIsLoginLoading(true);
        try {
            const res = await authService.login(usernameLogin.trim(), passwordLogin)
            if (res && res.success) {
                const { token } = res.data
                await authService.saveAuth(token)
                navigation.replace('Home')
            } else {
                const msg = (res && res.message) || 'فشل تسجيل الدخول'
                showAlert('خطأ', msg)
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'حدث خطأ'
            showAlert('خطأ', msg)
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!usernameRegister.trim() || !passwordRegister || !confirmPasswordRegister) {
            showAlert('حقل مطلوب', 'يرجى ملء جميع الحقول المطلوبة')
            return
        }

        setIsRegisterLoading(true)
        try {
            const res = await authService.register(usernameRegister.trim(), passwordRegister, confirmPasswordRegister)
            if (res && res.success) {
                const { token } = res.data
                await authService.saveAuth(token)
                navigation.replace('Home')
            } else {
                const msg = (res && res.message) || 'فشل التسجيل'
                showAlert('خطأ', msg)
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'حدث خطأ'
            showAlert('خطأ', msg)
        } finally {
            setIsRegisterLoading(false)
        }
    }
    const beforeTopAnim = useRef(new Animated.Value(0)).current;
    const togglePanelTopAnim = useRef(new Animated.Value(0)).current;
    const togglePanelBottomAnim = useRef(new Animated.Value(0)).current;
    const formBoxHeightAnim = useRef(new Animated.Value(0)).current;
    const [showPasswordLogin, setShowPasswordLogin] = useState(false);
    const [showPasswordRegister, setShowPasswordRegister] = useState(false);
    const [showConfirmPasswordRegister, setShowConfirmPasswordRegister] = useState(false);

    const beforeTop = beforeTopAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-270%', '70%'],
    });
    const togglePanelTop = togglePanelTopAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '-30%'],
    });
    const togglePanelBottom = togglePanelBottomAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-30%', '0%'],
    });
    const formBoxHeight = formBoxHeightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['125%', '72.5%'],
    });

    const toggleForm = () => {
        const toValue = showLogin ? 1 : 0;
        Animated.parallel([
            Animated.timing(beforeTopAnim, {
                toValue,
                duration: 1800,
                delay: 0,
                useNativeDriver: false,
            }),
            Animated.timing(togglePanelTopAnim, {
                toValue,
                duration: 600,
                delay: showLogin ? 600 : 1200,
                useNativeDriver: false,
            }),
            Animated.timing(togglePanelBottomAnim, {
                toValue,
                duration: 600,
                delay: showLogin ? 1200 : 600,
                useNativeDriver: false,
            }),
            Animated.timing(formBoxHeightAnim, {
                toValue,
                duration:600,
                delay: 1200,
                useNativeDriver: false,
            }),
        ]).start();
        setTimeout(() => {
            setShowLogin(prev => !prev);
        }, 1200);
    };

    return (
        <LinearGradient
            colors={['#e2e2e2', '#c9d6ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.body}
        >
            <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <KeyboardAwareScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        minHeight: height - 60,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                        <Animated.View style={[styles.formBox, { height: formBoxHeight }]}> 
                            <View style={styles.form}>
                                {showLogin ? (
                                    <>
                                        <Text style={styles.formTitle}>تسجيل الدخول</Text>
                                        <View style={styles.inputBox}>
                                            <TextInput 
                                            style={styles.input} 
                                            placeholder='اسم المستخدم' 
                                            placeholderTextColor="#888888"
                                            textAlign='right' 
                                            value={usernameLogin} 
                                            onChangeText={setUsernameLogin}
                                            editable={!isCheckingToken}
                                            required
                                            />
                                            <FontAwesome 
                                            name="user" 
                                            size={26} 
                                            color="rgb(136, 136, 136)" 
                                            style={styles.icon} 
                                            />
                                        </View>
                                        <View style={styles.inputBox}>
                                            <TextInput 
                                            style={styles.input} 
                                            placeholder='كلمة المرور' 
                                            placeholderTextColor="#888888"
                                            secureTextEntry={showPasswordLogin ? false : true} 
                                            textAlign='right' 
                                            value={passwordLogin} 
                                            onChangeText={setPasswordLogin}
                                            editable={!isCheckingToken}
                                            required
                                            />
                                            <TouchableOpacity
                                            style={styles.icon}
                                            onPress={() => setShowPasswordLogin(prev => !prev)}>
                                                <Ionicons 
                                                name={showPasswordLogin ? "eye" : "eye-off"} 
                                                size={26} 
                                                color="rgb(136, 136, 136)" 
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity 
                                        style={styles.button} 
                                        onPress={handleLogin} 
                                        disabled={isCheckingToken || isLoginLoading}
                                        activeOpacity={0.8}
                                        >
                                            {isCheckingToken || isLoginLoading
                                                ? <ActivityIndicator color="#ffffff" />
                                                : <Text style={styles.text}>تسجيل الدخول</Text>}
                                        </TouchableOpacity>
                                        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
                                        <Text style={styles.paragraph}>صلاة يسوع القصيرة (يا ربي يسوع المسيح، ابن الله، ارحمني أنا الخاطئ) هي أمضى سلاح ضد الأفكار الشريرة. رددها باستمرار، فيهرب الشيطان ويستنير العقل.</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.formTitle}>تسجيل</Text>
                                        <View style={styles.inputBox}>
                                            <TextInput 
                                            style={styles.input} 
                                            placeholder='اسم المستخدم' 
                                            placeholderTextColor="#888888"
                                            textAlign='right' 
                                            value={usernameRegister} 
                                            onChangeText={setUsernameRegister} 
                                            required
                                            />
                                            <FontAwesome 
                                            name="user" 
                                            size={26} 
                                            color="rgb(136, 136, 136)" 
                                            style={styles.icon} 
                                            />
                                        </View>
                                        <View style={styles.inputBox}>
                                            <TextInput 
                                            style={styles.input} 
                                            placeholder='كلمة المرور' 
                                            placeholderTextColor="#888888"
                                            secureTextEntry={showPasswordRegister ? false : true} 
                                            textAlign='right' 
                                            value={passwordRegister} 
                                            onChangeText={setPasswordRegister} 
                                            required
                                            />
                                            <TouchableOpacity
                                            style={styles.icon} 
                                            onPress={() => setShowPasswordRegister(prev => !prev)}>
                                                <Ionicons 
                                                name={showPasswordRegister ? "eye" : "eye-off"} 
                                                size={26} 
                                                color="rgb(136, 136, 136)" 
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.inputBox}>
                                            <TextInput 
                                            style={styles.input} 
                                            placeholder='تأكيد كلمة المرور' 
                                            placeholderTextColor="#888888"
                                            secureTextEntry={showConfirmPasswordRegister ? false : true} 
                                            textAlign='right' 
                                            value={confirmPasswordRegister} 
                                            onChangeText={setConfirmPasswordRegister} 
                                            required
                                            />
                                            <TouchableOpacity 
                                            style={styles.icon} 
                                            onPress={() => setShowConfirmPasswordRegister(prev => !prev)}>
                                                <Ionicons 
                                                name={showConfirmPasswordRegister ? "eye" : "eye-off"} 
                                                size={26} 
                                                color="rgb(136, 136, 136)" 
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity 
                                        style={styles.button} 
                                        onPress={handleRegister}
                                        disabled={isRegisterLoading}
                                        activeOpacity={0.8}
                                        >
                                            {isRegisterLoading
                                                ? <ActivityIndicator color="#ffffff" />
                                                : <Text style={styles.text}>تسجيل</Text>}
                                        </TouchableOpacity>
                                        <Text style={styles.paragraph}>الصلاة هي أكسجين الروح، وبدونها يختنق الإنسان روحياً وسط هموم الحياة ومشاكلها.</Text>
                                    </>
                                )}
                            </View>
                        </Animated.View>
                        <View style={styles.toggleBox}>
                            <Animated.View style={[styles.before, { top: beforeTop }]} />
                            <Animated.View style={[styles.togglePanel, { top: togglePanelTop } ]}> 
                                <Text style={styles.toggletitle}>فرقة القديس باييسيوس الآثوسي</Text>
                                <Text style={styles.toggleParagraph}>الصف الثامن</Text>
                                <TouchableOpacity style={styles.toggleButton} onPress={toggleForm} activeOpacity={0.8} disabled={isCheckingToken}>
                                    <Text style={styles.toggleTextButton}>تسجيل</Text>
                                </TouchableOpacity>
                            </Animated.View>
                            <Animated.View style={[styles.togglePanel, { bottom: togglePanelBottom } ]}> 
                                <Text style={styles.toggletitle}>فرقة القديس باييسيوس الآثوسي</Text>
                                <Text style={styles.toggleParagraph}>الصف الثامن</Text>
                                <TouchableOpacity style={styles.toggleButton} onPress={toggleForm} activeOpacity={0.8} disabled={isCheckingToken}>
                                    <Text style={styles.toggleTextButton}>تسجيل الدخول</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                </KeyboardAwareScrollView>
            </ScrollView>
        </LinearGradient>
    )
}