/* 
File: profile.tsx
Function: This is the user Profile screen component for the app. 
*/

import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Pressable,
  Keyboard,
} from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  onAuthStateChanged,
  User,
  updateProfile,
  getAuth,
} from "firebase/auth";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { query, where, collection, getDocs, orderBy } from "firebase/firestore";
import { styles, inputTheme } from "./styles/app_styles.styles";
import { profileStyles } from "./styles/profile.styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as ImagePicker from "expo-image-picker";
import { setDoc, onSnapshot } from "firebase/firestore";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import UserItineraries from "./user_itineraries";
import UserPosts from "./user_posts";
// this defines what the post object should look like
type Post = {
  id: string;
  urls: string[];
  uploader: string;
  uid: string;
  city: {
    id: string;
    name: string;
    country: string;
  };
  review: string;
  ratingValue: number;
  timestamp: number;
};

// Define the navigation parameter list
export type RootParamList = {
  Profile: undefined;
  Login: undefined;
};
type SearchUser = {
  uid: string;
  username: string;
};

// Define the type for Profile screen navigation prop
type ProfileScreenProp = NativeStackNavigationProp<RootParamList, "Profile">;

// Profile component
const Profile = () => {
  // Initialize navigation with type safety
  const navigation = useNavigation<ProfileScreenProp>();
  const [user, setUser] = useState<User | null>(null); // Stores the user
  const [username, setUsername] = useState<string | null>(null); // Stores the username
  const [isEditing, setIsEditing] = useState(false); // False: user is viewing profile and True: user is editing profile
  const [editedName, setEditedName] = useState(""); // Temporary value for when user is editing
  const [editedUsername, setEditedUsername] = useState(""); // Temporary value for when user is editing
  const [error, setError] = useState(""); // Stores error
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uloading, setUploading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const subTab = createMaterialTopTabNavigator();

  // Function to check if username is already taken
  const isUsernameTaken = async (usernameCheck: string) => {
    // usernameCheck = username user wants to change to
    const q = query(
      // Queries users database and checks if username is equal usernameCheck
      collection(FIREBASE_DB, "users"),
      where("username", "==", usernameCheck),
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if username exists
  };

  // Edit profile logic
  const handleEditProfile = () => {
    setEditedName(user?.displayName || "");
    setEditedUsername(username || "");
    setIsEditing(true); // User is editing
  };

  // Save profile logic
  const handleSaveProfile = async () => {
    if (!user) return;

    setError(""); // Clear any errors

    if (!editedName.trim() || !editedUsername.trim()) {
      // No blank names or usernames
      setError("Name and username cannot be empty.");
      return;
    }

    if (
      editedUsername !== username &&
      (await isUsernameTaken(editedUsername))
    ) {
      // No duplicate usernames
      setError("This username is already taken.");
      return;
    }

    try {
      await updateProfile(user, { displayName: editedName }); // Update Firebase displayName
      await updateDoc(doc(FIREBASE_DB, "users", user.uid), {
        username: editedUsername,
      }); // Update Firestore username
      setUsername(editedUsername);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (currentUser) => {
        if (!currentUser) {
          console.warn("User not signed in!");
          return;
        }

        setUser(currentUser);

        const userRef = doc(FIREBASE_DB, "users", currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUsername(data.username);
            setProfileImage(data.profileImage || null);
          }
          setLoadingUser(false);
        });
        return unsubscribeSnapshot;
      },
    );

    return unsubscribe;
  }, []);

  const handleUploadProfileImage = async () => {
    if (!user) {
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const localUri = result.assets[0].uri;

    try {
      const response = await fetch(
        "https://9151a7q1kc.execute-api.us-east-1.amazonaws.com/default/GenerateProfileUploadUrl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid: user.uid }),
        },
      );

      const { uploadUrl, fileUrl } = await response.json();
      const image = await fetch(localUri);
      const blob = await image.blob();

      await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
      });

      await setDoc(
        doc(FIREBASE_DB, "users", user.uid),
        { profileImage: fileUrl },
        { merge: true },
      );

      setProfileImage(`${fileUrl}?t=${Date.now()}`);

      Alert.alert("Profile picture updated!");
    } catch (error) {
      console.error(error);
      Alert.alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // When handleViewPrefernces is called (menu icon pressed) it goes to profile_preferences.tsx page
  const handleViewPreferences = () => {
    navigation.navigate("ProfilePreferences" as never);
  };

  return (
    <Pressable onPress={Keyboard.dismiss} style={profileStyles.dismissKeyboardConstainer}>
      <View style={styles.solidBackgroundContainer}>
        {/* Background image */}
        <View style={profileStyles.topImageContainer}>
          <Image
            source={require("../../assets/profile_background_image.png")}
            style={profileStyles.topImage}
            resizeMode="cover"
          />
          <View style={profileStyles.halfCircleCutout} />
        </View>
        <View style={styles.topRightIcon}>
          <TouchableOpacity onPress={() => handleViewPreferences()}>
            {/* Menu button */}
            <GlassView style={styles.glassButton}>
              <Ionicons name="ellipsis-vertical" size={26} color="#000" />
            </GlassView>
          </TouchableOpacity>
        </View>

        <ScrollView>
          {/* Profile image and edit button */}
          <View style={profileStyles.profileImageContainer}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../assets/profile_pic.png")
              }
              style={profileStyles.profileImage}
            />
            <TouchableOpacity
              style={profileStyles.editIconContainer}
              onPress={handleEditProfile}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Name and username */}
          <View style={profileStyles.nameContainer}>
            <Text variant="headlineLarge" style={profileStyles.name}>
              {user?.displayName}
            </Text>
            <Text variant="headlineSmall" style={profileStyles.username}>
              @{username}
            </Text>
          </View>

          {/* Name and username edit fields */}
          {isEditing && (
            <Modal visible={isEditing} transparent animationType="fade">
              <View style={styles.modalDimOverlay}>
                {/* Full-screen Pressable overlay that closes modal */}
                <Pressable
                  style={profileStyles.modalOverlayPressable}
                  onPress={() => setIsEditing(false)}
                />
                <View style={profileStyles.editModalContainer}>
                  <View style={profileStyles.editModalInnerContainer}>
                    <TouchableOpacity
                      style={profileStyles.editProfileCloseButtonShared}
                      onPress={() => setIsEditing(false)}
                    >
                      <GlassView style={styles.glassButton}>
                        <Ionicons name="close" size={26} color="#000" />
                      </GlassView>
                    </TouchableOpacity>

                    <Text style={profileStyles.editModalTitle}>
                      Edit Profile
                    </Text>

                    <TextInput
                      value={editedName}
                      onChangeText={setEditedName}
                      style={styles.input}
                      label="Full Name"
                      theme={inputTheme}
                      mode="outlined"
                    />

                    <TextInput
                      value={editedUsername}
                      onChangeText={setEditedUsername}
                      style={styles.input}
                      label="Username"
                      autoCapitalize="none"
                      theme={inputTheme}
                      mode="outlined"
                    />

                    {error ? (
                      <Text style={profileStyles.editError}>{error}</Text>
                    ) : null}

                    <Button
                      mode="outlined"
                      onPress={handleUploadProfileImage}
                      style={profileStyles.changePhotoButton}
                      labelStyle={profileStyles.photoButtonLabel}
                      icon={({ size, color }) => (
                        <MaterialCommunityIcons
                          name="camera"
                          size={24}
                          color={color}
                        />
                      )}
                    >
                      Change Profile Photo
                    </Button>

                    <Button
                      mode="contained"
                      onPress={handleSaveProfile}
                      style={styles.button}
                      labelStyle={styles.buttonLabel}
                    >
                      Save
                    </Button>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
        <View style={profileStyles.tabContainer}>
          <subTab.Navigator
            screenOptions={{
              tabBarIndicatorStyle: profileStyles.tabIndicator,
              tabBarLabelStyle: profileStyles.tabLabel,
              tabBarStyle: profileStyles.tabBar,
            }}
          >
            <subTab.Screen
              name="Posts"
              children={() => (
                <View style={profileStyles.tabContent}>
                  <UserPosts userId={currentUser?.uid ?? ""} />
                </View>
              )}
            />

            <subTab.Screen
              name="Itineraries"
              children={() => (
                <View style={profileStyles.tabContent}>
                  <UserItineraries />
                </View>
              )}
            />
          </subTab.Navigator>
        </View>
      </View>
    </Pressable>
  );
};

export default Profile;
