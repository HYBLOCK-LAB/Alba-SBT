import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { colors } from '../constants/theme';
import type { ManagerStackParamList, ManagerTabParamList } from './types';

import ManagerHomeScreen from '../screens/manager/ManagerHomeScreen';
import StoreRegisterScreen from '../screens/manager/StoreRegisterScreen';
import StoreManagementScreen from '../screens/manager/StoreManagementScreen';
import ManagerVerifyQRScreen from '../screens/manager/ManagerVerifyQRScreen';
import ManagerHRScreen from '../screens/manager/ManagerHRScreen';
import ManagerAttendanceScreen from '../screens/manager/ManagerAttendanceScreen';
import ManagerExtraWorkScreen from '../screens/manager/ManagerExtraWorkScreen';
import ManagerQRScreen from '../screens/manager/ManagerQRScreen';
import LevelUpApprovalScreen from '../screens/manager/LevelUpApprovalScreen';
import CareerReportScreen from '../screens/manager/CareerReportScreen';

// ── 탭 아이콘 ───────────────────────────────────────────────────────────────
function HomeIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', bottom: 0, left: 2, right: 2, height: 13,
        borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2,
        borderColor: color, borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
      }} />
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center',
      }}>
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 9,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: color,
        }} />
      </View>
    </View>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 13, height: 13, borderRadius: 7,
        borderWidth: 2, borderColor: color,
      }} />
      <View style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 6, height: 2, borderRadius: 1,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

// ── Tab Navigator ──────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<ManagerTabParamList>();

function ManagerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="ManagerHome" component={ManagerHomeScreen} />
      <Tab.Screen name="ManagerVerify" component={ManagerHomeScreen} />
    </Tab.Navigator>
  );
}

// ── Stack Navigator ────────────────────────────────────────────────────────
const Stack = createStackNavigator<ManagerStackParamList>();

export default function ManagerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ManagerTab" component={ManagerTabNavigator} />
      <Stack.Screen name="StoreRegister" component={StoreRegisterScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ManagerHR" component={ManagerHRScreen} />
      <Stack.Screen name="ManagerAttendance" component={ManagerAttendanceScreen} />
      <Stack.Screen name="ManagerExtraWork" component={ManagerExtraWorkScreen} />
      <Stack.Screen name="ManagerQR" component={ManagerQRScreen} />
      <Stack.Screen name="LevelUpApproval" component={LevelUpApprovalScreen} />
      <Stack.Screen name="CareerReport" component={CareerReportScreen} />
      <Stack.Screen name="StoreManagement" component={StoreManagementScreen} />
      <Stack.Screen name="ManagerVerifyQR" component={ManagerVerifyQRScreen} />
    </Stack.Navigator>
  );
}
