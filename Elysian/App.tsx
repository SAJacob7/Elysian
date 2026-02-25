/* 
File: App.tsx
Function: This is the main entry point of the React Native app. It defines the app's navigation structure using React Navigation's Native Stack Navigator. Each screen is registered here and can be navigated between throughout the app.
*/

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './app/screens/login';
import Landing from './app/screens/landing';
import SignUp from './app/screens/sign_up';
import ProfileLanding from './app/screens/profile_landing';
import ProfileSetup from './app/screens/profile_setup';
import NavigationBar from './app/screens/navigation_bar';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from './FirebaseConfig';

// Create a stack navigator instance
const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={Landing} />
      <Stack.Screen name="Login" component={Login} options={{ animation: "none" }} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
}

function AccountCreationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileLanding" component={ProfileLanding} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return <NavigationBar />;
}

export default function App() {
  // Holds the currently authenticated Firebase user
  // Firebase automatically restores this session on app launch
  const [user, setUser] = useState<any>(null);

  // Tracks whether the user has completed account creation/onboarding
  // null = still loading / unknown
  const [accountCreationComplete, setAccountCreationComplete] =
    useState<boolean | null>(null);

  // Listen for Firebase authentication state changes
  // This fires on app startup (auto-login/session restore), login, and logout
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (u) => {
      // Set the authenticated user (or null if logged out)
      setUser(u);

      // If no user is logged in, reset onboarding state
      if (!u) {
        setAccountCreationComplete(null);
        return;
      }

      // Listen to the user's Firestore document in real time
      // This allows us to check if account creation is complete
      const unsubscribeUser = onSnapshot(
        doc(FIREBASE_DB, 'users', u.uid),
        (snap) => {
          // Safely read the accountCreationComplete flag
          setAccountCreationComplete(
            snap.data()?.accountCreationComplete === true
          );
        }
      );

      // Cleanup Firestore listener when auth user changes
      return unsubscribeUser;
    });

    // Cleanup auth listener when App component unmounts
    return unsubscribeAuth;
  }, []);

  // Prevent rendering any navigation while the user is logged in but Firestore data has not loaded yet
  if (user && accountCreationComplete === null) {
    return null;
  }

  return (
    <NavigationContainer>
      {/* No user logged in. Show authentication flow. */}
      {!user ? (
        <AuthStack />
      ) : 
      /* User logged in but account is not created. Show account creation flow. */
      !accountCreationComplete ? (
        <AccountCreationStack />
      ) : (
        /* User logged in and account is created. Show main app flow. */
        <AppStack />
      )}
    </NavigationContainer>
  );
}

