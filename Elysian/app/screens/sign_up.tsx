/* 
File: sign_up.tsx
Function: This is the Sign Up screen component for the app that allows users to create an account. Firebase is used to store new user credentials.
*/

import {
  View,
  Alert,
  Keyboard,
  Pressable,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, Text } from "react-native-paper";
import React, { useState, useEffect } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { styles, inputTheme } from "./styles/app_styles.styles";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Define the navigation parameter list
export type RootParamList = {
  Login: undefined;
  Home: undefined;
  SignUp: undefined;
  ProfileLanding: undefined;
};

// Define the type for Home screen navigation prop
type SignUpScreenProp = NativeStackNavigationProp<RootParamList, "SignUp">;

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation<SignUpScreenProp>();

  // Handle account create with Firebase
  const handleCreateAccount = async () => {
    // Validate that all fields are filled
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Mising Information", "Please fill in all fields.");
      return;
    }

    // Check that password and confirmPassword matches
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Re-enter your password.");
    }

    setLoading(true);

    try {
      // Create new user with email and password in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password,
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await setDoc(doc(FIREBASE_DB, "users", user.uid), {
        username: username,
        createdAt: new Date(),
        accountCreationComplete: false,
        name: user.displayName,
      });

      // Below line should remember user name in session, but not sure if working.
      // await updateProfile(user, { displayName: name });
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to Login screen
  const goToSignIn = async () => {
    navigation.push("Login");
  };

  return (
    <ImageBackground
      source={require("../../assets/login_page_background.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView
        style={styles.container}
        onTouchStart={() => {
          Keyboard.dismiss();
        }}
      >
        <Text variant="displaySmall" style={styles.header1}>
          Create Account
        </Text>
        <Text variant="titleMedium" style={styles.subtext1}>
          Fill in the details and sign up.
        </Text>

        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          theme={inputTheme}
        />

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          theme={inputTheme}
        />

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
          label="Create Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          textContentType="newPassword"
          theme={inputTheme}
        />

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          textContentType="newPassword"
          theme={inputTheme}
        />

        <Button
          mode="contained"
          onPress={handleCreateAccount}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          {loading ? "Creating..." : "Sign Up"}
        </Button>

        <View style={styles.signupContainer}>
          <Text variant="labelLarge"> Already have an account? </Text>
          <Pressable
            onPress={goToSignIn}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={styles.signupLink}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default SignUp;
