// _layout.tsx -- The root layout.
// Every screen in the app passes through here,
// like a bouncer who judges your life choices.

import '../global.css';

import type React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

/**
 * Root layout for the entire app.
 * Sets up the stack navigator, dark theme, and the general
 * atmosphere of productive self-destruction.
 *
 * @returns The root layout wrapping all screens
 */
export default function RootLayout(): React.ReactNode {
  return (
    <View className="flex-1 bg-abyss">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#06060a' },
          headerTintColor: '#39ff14',
          headerTitleStyle: { fontFamily: 'monospace', fontWeight: '700' },
          contentStyle: { backgroundColor: '#06060a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '// TimeToRelax',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="session"
          options={{
            title: '// Session',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: '// Settings',
            headerShown: true,
          }}
        />
      </Stack>
    </View>
  );
}
