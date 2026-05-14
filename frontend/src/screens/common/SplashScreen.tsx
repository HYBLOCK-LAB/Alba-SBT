import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors } from '../../constants/theme';
import type { AuthScreenProps } from '../../navigation/types';

export default function SplashScreen({ navigation }: AuthScreenProps<'Splash'>) {
  const dot1 = new Animated.Value(0);
  const dot2 = new Animated.Value(0);
  const dot3 = new Animated.Value(0);

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]).start();

    const timer = setTimeout(() => navigation.replace('WalletConnect'), 2200);
    return () => clearTimeout(timer);
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot,
    transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  });

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.neutral[900] }}>
      {/* App Icon */}
      <View
        className="w-20 h-20 rounded-3xl items-center justify-center mb-8"
        style={{ backgroundColor: colors.brand[700] }}
      >
        <View
          className="w-10 h-10 rounded-xl"
          style={{ backgroundColor: colors.brand[400] }}
        />
      </View>

      {/* App name */}
      <Text className="text-white font-bold text-2xl tracking-tight mb-1">
        Alba<Text style={{ color: colors.brand[400] }}>SBT</Text>
      </Text>
      <Text className="text-sm font-medium mb-16" style={{ color: colors.neutral[500] }}>
        블록체인 경력 증명 플랫폼
      </Text>

      {/* Loading dots */}
      <View className="flex-row gap-2">
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            className="w-2 h-2 rounded-full"
            style={[{ backgroundColor: colors.brand[400] }, dotStyle(dot)]}
          />
        ))}
      </View>
    </View>
  );
}
