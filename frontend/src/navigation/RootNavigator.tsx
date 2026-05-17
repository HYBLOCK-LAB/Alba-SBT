import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import WorkerNavigator from './WorkerNavigator';
import ManagerNavigator from './ManagerNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // 개발 중 진입점 전환: 'Auth' | 'Worker' | 'Manager'
  const devInitial: keyof RootStackParamList = 'Manager';

  return (
    <Stack.Navigator initialRouteName={devInitial} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Worker" component={WorkerNavigator} />
      <Stack.Screen name="Manager" component={ManagerNavigator} />
    </Stack.Navigator>
  );
}
