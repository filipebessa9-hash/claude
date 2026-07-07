import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="entrar" options={{ title: 'Entrar' }} />
        <Stack.Screen name="criar-conta" options={{ title: 'Criar conta' }} />
        <Stack.Screen name="home" options={{ title: 'MetaLink' }} />
      </Stack>
    </AuthProvider>
  );
}
