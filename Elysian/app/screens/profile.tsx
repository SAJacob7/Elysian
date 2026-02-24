/* 
File: profile.tsx
Function: This is the user Profile screen component for the app. 
*/

import React, { useEffect, useState } from "react";
import { View, Image, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { query, where, collection, getDocs, orderBy } from "firebase/firestore";
import { styles, inputTheme } from "./app_styles.styles";
import { profileStyles } from "./profile.styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as ImagePicker from "expo-image-picker";
import { setDoc, onSnapshot } from "firebase/firestore";
import { Alert, FlatList } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { homeStyles } from "./home.styles";
import { SafeAreaView } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { getAuth } from "firebase/auth";
import { deleteField } from "firebase/firestore";

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
  const [expandedReview, setExpandedReview] = useState<{ [key: string]: boolean }>({});
  const [userFavorites, setUserFavorites] = useState<{ [key: string]: boolean }>({});
  
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
        }
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
        { merge: true }
      );

      setProfileImage(`${fileUrl}?t=${Date.now()}`);

      Alert.alert("Profile picture updated!");
    }
    catch (error) {
      console.error(error);
      Alert.alert("Upload failed");
    }
    finally {
      setUploading(false);
    }
  };
  
  const handleReview = (postId: string) => {
    setExpandedReview(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // When handleViewPrefernces is called (menu icon pressed) it goes to profile_preferences.tsx page
  const handleViewPreferences = () => {
    navigation.navigate("ProfilePreferences" as never);
  };

  const removeCity = async (city: { id: string; name: string; country: string }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const userFavoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);

      await setDoc(
        userFavoritesRef,
        {
          [city.id]: deleteField(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error removing from favorites:", err);
    }
  };
  
  const addCity = async (city: { id: string; name: string; country: string }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error("User not signed in.");
        return;
      }
      const userFavoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);

      await setDoc(
        userFavoritesRef,
        {
          [city.id]: {
            city_name: city.name,
            country_name: city.country,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error adding to favorites:", err);
    }
  };

  const UserPosts = () => {
    const [posts, setPosts] = useState<Post[]>([]); //initializes post as an empty array which is then updated by setPosts
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
      if(!user){
        return
      }
      const q = query(
        collection(FIREBASE_DB, "posts"),
        where("uid", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        // store the function that stops listening into the variable unsubscribe
        const data: Post[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, "id">),
        }));
        setPosts(data);
      });
      return () => unsubscribe();
    }, [user]);

    const openPostModal = (post: Post) =>{
      setSelectedPost(post);
      setModalVisible(true);
    };

    const closePostModal = () => {
      setSelectedPost(null);
      setModalVisible(false);
    }

    return (
      <SafeAreaView edges={["top"]}>
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
              <View style={homeStyles.postContainer}>

                {/* Image */}
                <View style={homeStyles.imageContainer}>
                  <FlatList
                    data={item.urls}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(uri, index) => uri + index}
                    renderItem={({ item: uri }) => (
                      <Image
                        source={{ uri }}
                        style={homeStyles.cityImage}
                        resizeMode="cover"
                      />
                    )}
                  />

                  {/* Progressive Blur on bottom */}
                  <View style={homeStyles.postBlurContainer}>
                    <MaskedView
                      maskElement={
                        <LinearGradient
                          colors={["transparent", "rgba(255,255,255,0.9)"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={{ flex: 1 }}
                        />
                      }
                      style={{ flex: 1 }}
                    >
                      <BlurView
                        intensity={100}
                        tint="dark"
                        style={{ flex: 1 }}
                      />
                    </MaskedView>
                  </View>

                  {/* City, Country */}
                  {item.city && (
                    <View style={homeStyles.cityOverlay}>
                      <Text style={homeStyles.cityFont}>
                        {item.city.name}
                      </Text>

                      <View style={homeStyles.pinIcon}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={22}
                          color="white"
                        />
                        <Text style={homeStyles.countryFont}>
                          {item.city.country}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Rating */}
                  {item.ratingValue !== undefined && (
                    <View style={homeStyles.ratingOverlay}>
                      <View style={homeStyles.ratingTag}>
                        <Text style={homeStyles.ratingFont}>
                          {item.ratingValue.toFixed(1)}
                        </Text>
                        <MaterialCommunityIcons
                          name="star-face"
                          size={20}
                          color="#000"
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Uploader, review, date */}
                <View style={homeStyles.contentContainer}>
                  <View>
                    <Text style={homeStyles.uploader}>
                      @{item.uploader}
                    </Text>
                    <TouchableOpacity onPress={() => handleReview(item.id)}>
                      <Text
                        style={homeStyles.reviewFont}
                        numberOfLines={expandedReview[item.id] ? undefined : 2}
                        ellipsizeMode="tail"
                      >
                        {item.review}
                      </Text>
                    </TouchableOpacity>
                    <Text style={homeStyles.date}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={homeStyles.postIcons}>
                    <TouchableOpacity>
                      <Ionicons name="heart-outline" size={28} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (!item.city) return;

                        const postCity = {
                          id: item.city.id,
                          name: item.city.name,
                          country: item.city.country,
                        };

                        if (userFavorites[item.city.id]) { // Already saved so remove city 
                          removeCity(postCity);
                        } else {
                          addCity(postCity); // Not saved so add city to favorites 
                        }
                      }}
                    >
                      <Ionicons
                        name={item.city && userFavorites[item.city.id] ? "bookmark" : "bookmark-outline"}
                        size={28}
                        color={item.city && userFavorites[item.city.id] ? "#000" : "#000"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
      
                </View>
              )}
            />
          </SafeAreaView>
        );
  };

  const UserItineraries = () => (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Text style={{ textAlign: "center", marginTop: 20 }}>User Itineraries</Text>
    </View>
  );


  return (
    <View style={styles.homeContainer}>
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
              profileImage ? { uri: profileImage } : require("../../assets/profile_temp.jpg")
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
          <Text style={profileStyles.name}>{user?.displayName}</Text>
          <Text style={profileStyles.username}>@{username}</Text>
        </View>

        {/* Name and username edit fields */}
        {isEditing && (
          <Modal visible={isEditing} transparent animationType="fade" >
            <View style={profileStyles.editModalOverlay}>
              <View style={profileStyles.editModalContent}>
                <Text style={profileStyles.editModalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  style={profileStyles.closeButton}
                  onPress={() => setIsEditing(false)}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>

                <TextInput
                  value={editedName}
                  onChangeText={setEditedName}
                  style={styles.input}
                  label="New Name"
                  theme={inputTheme}
                  mode="outlined"
                />

                <TextInput
                  value={editedUsername}
                  onChangeText={setEditedUsername}
                  style={styles.input}
                  label="New Username"
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
                  style={{ marginBottom: 10 }}
                >
                  Change Profile Picture
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
          </Modal>
        )}

      </ScrollView>
      <View style={{ flex: 1, marginTop: -500 }}>
        <subTab.Navigator
          screenOptions={{
            tabBarIndicatorStyle: { backgroundColor: "#000" },
            tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
            tabBarStyle: { backgroundColor: "transparent" },
          }}
        >
          <subTab.Screen name="Posts" component={UserPosts} />
          <subTab.Screen name="Itineraries" component={UserItineraries} />
        </subTab.Navigator>
      </View>
    </View>
  );
};

export default Profile;
