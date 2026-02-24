/* 
File: login.tsx
Function: This is the Login screen component for the app that displays the app logo.
*/

import { View, Alert } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { styles, inputTheme } from "./app_styles.styles";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Define the navigation parameter list
export type RootParamList = {
  Login: undefined;
  Home: undefined;
  SignUp: undefined;
  NavigationBar: undefined;
};

// Define the type for Home screen navigation prop
type LoginScreenProp = NativeStackNavigationProp<RootParamList, "Login">;

// Login component
const Login = () => {
  // State hooks for email, password, and loading status
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Initialize navigation with type safety
  const navigation = useNavigation<LoginScreenProp>();

  // Handles user sign in
  const signIn = async () => {
    setLoading(true);

    try {
      const response = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email.trim(),
        password.trim(),
      );
      const user = response.user;
      await updateDoc(doc(FIREBASE_DB, "users", user.uid), {
        accountCreationComplete: true,
      });

      console.log("Signed in user:", user);

    } catch (error: any) {
      console.log("Sign-in error:", error.code, error.message);
      Alert.alert("Sign-in Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handles navigation to SignUp screen
  const signUp = async () => {
    navigation.push("SignUp");
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Sign In Now
      </Text>
      <Text variant="bodyLarge" style={styles.subtext}>
        Please sign in to start your adventure!
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        theme={inputTheme}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        theme={inputTheme}
      />

      <Button
        mode="contained"
        onPress={signIn}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Login
      </Button>

      <View style={styles.signupContainer}>
        <Text>
          Don't have an account?{" "}
          <Text style={styles.signupLink} onPress={signUp}>
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default Login;
