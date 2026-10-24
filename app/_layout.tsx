import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/theme';
import { initSfx } from '../src/lib/sfx';

// Keep the splash (photo of the girls) up a beat longer so they can see it.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function RootLayout() {
  // Orientation is locked to landscape via app.json ("orientation": "landscape").
  useEffect(() => {
    initSfx();
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
            animation: 'fade',
            // iOS 27 ignores the app-wide status bar API – hide it per screen instead
            statusBarHidden: true,
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
