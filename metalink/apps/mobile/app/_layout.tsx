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
        <Stack.Screen name="registrar-dose" options={{ title: 'Registrar dose' }} />
        <Stack.Screen name="peso" options={{ title: 'Peso' }} />
        <Stack.Screen name="registrar-peso" options={{ title: 'Registrar peso' }} />
        <Stack.Screen name="sintomas" options={{ title: 'Sintomas' }} />
        <Stack.Screen name="registrar-sintoma" options={{ title: 'Registrar sintoma' }} />
        <Stack.Screen name="check-in" options={{ title: 'Check-in do dia' }} />
        <Stack.Screen name="medico" options={{ title: 'Meu médico' }} />
        <Stack.Screen name="nivel" options={{ title: 'Nível estimado' }} />
        <Stack.Screen name="lembretes" options={{ title: 'Lembretes' }} />
        <Stack.Screen name="resumo" options={{ title: 'Resumo da semana' }} />
      </Stack>
    </AuthProvider>
  );
}
