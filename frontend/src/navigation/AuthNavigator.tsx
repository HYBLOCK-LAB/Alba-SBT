import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/common/SplashScreen';
import WalletConnectScreen from '../screens/common/WalletConnectScreen';
import AccountTypeScreen from '../screens/common/AccountTypeScreen';
import ProfileSetupScreen from '../screens/common/ProfileSetupScreen';
import type { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="WalletConnect" component={WalletConnectScreen} />
      <Stack.Screen name="AccountType" component={AccountTypeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
