import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { colors } from '../../constants/theme';
import { createStore } from '../../services/storeService';
import type { ManagerScreenProps } from '../../navigation/types';

function StepBar({ step }: { step: number }) {
  return (
    <View className="flex-row gap-1 mb-5">
      {[1, 2, 3].map(s => (
        <View key={s} className="flex-1 h-0.5 rounded-full" style={{
          backgroundColor: s < step ? colors.brand[700] : s === step ? colors.brand[400] : colors.neutral[200],
        }} />
      ))}
    </View>
  );
}

function InputField({ label, placeholder, value, onChangeText, required, keyboardType }: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; required?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-1 mb-1.5">
        <Text className="text-xs font-semibold" style={{ color: colors.neutral[500] }}>{label}</Text>
        {required && <Text style={{ color: colors.error, fontSize: 11 }}>*</Text>}
      </View>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.neutral[300]} keyboardType={keyboardType ?? 'default'}
        className="px-3.5 py-2.5 rounded-xl border text-sm"
        style={{ borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], color: colors.neutral[800], fontSize: 13 }}
      />
    </View>
  );
}

export default function StoreRegisterScreen({ navigation }: ManagerScreenProps<'StoreRegister'>) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category] = useState('외식업');
  const [subCategory, setSubCategory] = useState('');
  const [bizNum, setBizNum] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('위치 권한이 거부되었습니다');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const parts = [geo.city, geo.district, geo.street, geo.streetNumber].filter(Boolean);
      setAddress(parts.join(' ') || '주소를 찾을 수 없습니다');
    } catch {
      setAddress('위치를 가져오는 데 실패했습니다');
    } finally {
      setLocationLoading(false);
    }
  };

  // ── 스텝 3: 완료 ──────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <View style={{ width: 24, height: 36, borderRightWidth: 3, borderBottomWidth: 3, borderColor: colors.brand[700], transform: [{ rotate: '45deg' }, { translateY: -4 }] }} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.neutral[900], marginBottom: 8 }}>매장 등록 완료!</Text>
        <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
          {name || '매장'}이 등록되었습니다.{'\n'}이제 알바생을 연결하고 관리를 시작하세요.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.brand[700] }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── 스텝 2: 확인 ──────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.neutral[100], backgroundColor: colors.neutral[0] }}>
          <TouchableOpacity onPress={() => setStep(1)} style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[700], transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>매장 등록</Text>
          <View style={{ width: 20 }} />
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
          <StepBar step={2} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.neutral[900], marginBottom: 4 }}>입력 정보 확인</Text>
          <Text style={{ fontSize: 12, color: colors.neutral[400], marginBottom: 24 }}>아래 정보가 맞는지 확인해주세요</Text>

          {[
            { label: '매장명', value: name || '(미입력)' },
            { label: '업종', value: `${category} · ${subCategory || '(미입력)'}` },
            { label: '주소', value: address || '(미입력)' },
            { label: '사업자번호', value: bizNum || '(선택 사항)' },
            { label: '연락처', value: contact || '(선택 사항)' },
          ].map(item => (
            <View key={item.label} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[400], marginBottom: 4 }}>{item.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.neutral[800] }}>{item.value}</Text>
            </View>
          ))}

          <TouchableOpacity
            onPress={async () => {
              if (submitting) return;
              setSubmitting(true);
              try {
                await createStore({
                  name,
                  category,
                  sub_category: subCategory,
                  address,
                  latitude: coords?.latitude ?? 0,
                  longitude: coords?.longitude ?? 0,
                  gps_radius_meters: 50,
                  business_number: bizNum || undefined,
                  contact: contact || undefined,
                });
                setStep(3);
              } catch (e: any) {
                Alert.alert('등록 실패', e?.message ?? '다시 시도해 주세요.');
              } finally {
                setSubmitting(false);
              }
            }}
            style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 28, marginBottom: 40, backgroundColor: colors.brand[700] }}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>등록 완료</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── 스텝 1: 기본 정보 ──────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3" style={{ borderBottomWidth: 1, borderColor: colors.neutral[100], backgroundColor: colors.neutral[0] }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 13, height: 1.5, backgroundColor: colors.neutral[700], position: 'absolute', transform: [{ rotate: '45deg' }, { translateY: 4.5 }] }} />
          <View style={{ width: 13, height: 1.5, backgroundColor: colors.neutral[700], position: 'absolute', transform: [{ rotate: '-45deg' }, { translateY: -4.5 }] }} />
        </TouchableOpacity>
        <Text className="text-base font-bold" style={{ color: colors.neutral[900] }}>매장 등록</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <StepBar step={1} />
        <Text className="text-xl font-extrabold tracking-tight mb-1" style={{ color: colors.neutral[900] }}>기본 정보</Text>
        <Text className="text-xs mb-5" style={{ color: colors.neutral[400] }}>매장 이름과 업종을 입력해주세요</Text>

        {/* 매장 정보 */}
        <Text className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: colors.neutral[400] }}>매장 정보</Text>
        <InputField label="매장명" placeholder="맥도날드 신촌점" value={name} onChangeText={setName} required />

        {/* 업종 대분류 select */}
        <View className="mb-3">
          <View className="flex-row items-center gap-1 mb-1.5">
            <Text className="text-xs font-semibold" style={{ color: colors.neutral[500] }}>업종 대분류</Text>
            <Text style={{ color: colors.error, fontSize: 11 }}>*</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            className="flex-row items-center justify-between px-3.5 py-2.5 rounded-xl border"
            style={{ borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] }}
          >
            <Text className="text-sm" style={{ color: colors.neutral[900] }}>{category}</Text>
            <View style={{ width: 7, height: 7, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        </View>

        <InputField label="세부 업종" placeholder="패스트푸드" value={subCategory} onChangeText={setSubCategory} required />

        {/* 위치 */}
        <Text className="text-xs font-bold uppercase tracking-wider mb-2.5 mt-2" style={{ color: colors.neutral[400] }}>위치</Text>
        <TouchableOpacity
          onPress={handleGetLocation}
          disabled={locationLoading}
          activeOpacity={0.75}
          className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border mb-2"
          style={{ borderColor: colors.brand[200], backgroundColor: colors.neutral[0] }}
        >
          {locationLoading
            ? <ActivityIndicator size="small" color={colors.brand[600]} />
            : <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.brand[600] }} />
          }
          <Text className="text-xs font-semibold" style={{ color: colors.brand[700] }}>
            {locationLoading ? '위치 가져오는 중...' : '현재 위치 사용'}
          </Text>
        </TouchableOpacity>
        <View className="px-3.5 py-2.5 rounded-xl mb-3" style={{ backgroundColor: colors.neutral[50], borderWidth: 1.5, borderColor: address ? colors.brand[200] : colors.neutral[200] }}>
          <Text className="text-sm" style={{ color: address ? colors.neutral[800] : colors.neutral[400] }}>
            {address || '버튼을 눌러 현재 위치를 가져오세요'}
          </Text>
        </View>

        {/* 추가 정보 */}
        <View className="flex-row items-center gap-2 mb-2.5 mt-2">
          <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.neutral[400] }}>추가 정보</Text>
          <Text className="text-xs" style={{ color: colors.neutral[300] }}>선택</Text>
        </View>
        <InputField label="사업자번호" placeholder="000-00-00000" value={bizNum} onChangeText={setBizNum} keyboardType="numeric" />
        <InputField label="연락처" placeholder="02-0000-0000" value={contact} onChangeText={setContact} keyboardType="phone-pad" />

        <TouchableOpacity
          onPress={() => setStep(2)}
          activeOpacity={0.8}
          className="py-4 rounded-2xl items-center mt-2 mb-10"
          style={{ backgroundColor: colors.brand[700] }}
        >
          <Text className="font-bold text-white text-base">다음</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
