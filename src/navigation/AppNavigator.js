import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CitasScreen from '../screens/CitasScreen';
import MensajesScreen from '../screens/MensajesScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#1A6B5A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Registro', headerTitleAlign: 'center' }} 
        />
        
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerLeft: null, title: 'Inicio', headerTitleAlign: 'center' }} 
        />
        
        <Stack.Screen 
          name="Citas" 
          component={CitasScreen} 
          options={{ title: 'Mis Citas', headerTitleAlign: 'center' }} 
        />
        
        <Stack.Screen 
          name="Mensajes" 
          component={MensajesScreen} 
          options={{ title: 'Mensajes', headerTitleAlign: 'center' }} 
        />
        
        <Stack.Screen 
          name="Perfil" 
          component={PerfilScreen} 
          options={{ title: 'Mi Perfil', headerTitleAlign: 'center' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}