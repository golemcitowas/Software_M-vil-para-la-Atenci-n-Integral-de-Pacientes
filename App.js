import 'react-native-gesture-handler';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://66a811496e6603ae9dc2485b34b59595@o4511360981729280.ingest.us.sentry.io/4511598913978368",
});

export default function App() {
  return <AppNavigator />;
}