import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/theme';
import type { WorkerStackParamList, WorkerTabParamList } from './types';

import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
import StoreConnectScreen from '../screens/worker/StoreConnectScreen';
import StoreLandingScreen from '../screens/worker/StoreLandingScreen';
import QRScannerScreen from '../screens/worker/QRScannerScreen';
import WorkerAttendanceScreen from '../screens/worker/WorkerAttendanceScreen';
import WorkerExtraWorkScreen from '../screens/worker/WorkerExtraWorkScreen';
import WorkerPortfolioScreen from '../screens/worker/WorkerPortfolioScreen';

// ── SVG 아이콘 ─────────────────────────────────────────────────────────────
function HomeIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 16, height: 14, borderLeftWidth: 2, borderRightWidth: 2,
        borderBottomWidth: 2, borderColor: color, borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
        marginTop: 6,
      }} />
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        alignItems: 'center',
      }}>
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 9,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
        }} />
      </View>
    </View>
  );
}

function QRIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 18, borderWidth: 2, borderColor: color, borderRadius: 4 }}>
        <View style={{
          position: 'absolute', top: 3, left: 3, width: 4, height: 4,
          backgroundColor: color, borderRadius: 1,
        }} />
        <View style={{
          position: 'absolute', top: 3, right: 3, width: 4, height: 4,
          backgroundColor: color, borderRadius: 1,
        }} />
        <View style={{
          position: 'absolute', bottom: 3, left: 3, width: 4, height: 4,
          backgroundColor: color, borderRadius: 1,
        }} />
        <View style={{
          position: 'absolute', bottom: 3, right: 3, width: 4, height: 4,
          backgroundColor: color, borderRadius: 1,
        }} />
      </View>
    </View>
  );
}

function CalIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, borderWidth: 2, borderColor: color, borderRadius: 4 }}>
      <View style={{ height: 5, borderBottomWidth: 1.5, borderColor: color }} />
    </View>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 16, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 2, height: 16, backgroundColor: color, borderRadius: 1, position: 'absolute' }} />
    </View>
  );
}

// ── Tab Navigator ──────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<WorkerTabParamList>();

function WorkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.neutral[0],
          borderTopColor: colors.neutral[100],
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brand[700],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="WorkerHome"
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerAttendance"
        component={WorkerAttendanceScreen}
        initialParams={{ storeId: 'mock-store-1' }}
        options={{
          tabBarLabel: '근태',
          tabBarIcon: ({ color }) => <CalIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerExtraWork"
        component={WorkerExtraWorkScreen}
        initialParams={{ storeId: 'mock-store-1' }}
        options={{
          tabBarLabel: '추가근무',
          tabBarIcon: ({ color }) => <PlusIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerPortfolio"
        component={WorkerPortfolioScreen}
        options={{
          tabBarLabel: '포트폴리오',
          tabBarIcon: ({ color }) => <QRIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Stack Navigator ────────────────────────────────────────────────────────
const Stack = createStackNavigator<WorkerStackParamList>();

export default function WorkerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="WorkerTab" component={WorkerTabNavigator} />
      <Stack.Screen name="StoreConnect" component={StoreConnectScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="StoreLanding" component={StoreLandingScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
