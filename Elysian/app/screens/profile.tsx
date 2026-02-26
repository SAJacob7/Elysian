/* 
File: profile.tsx
Function: This is the user Profile screen component for the app. 
*/

import React, { useEffect, useRef, useState } from "react";
import { View, Image, ScrollView, TouchableOpacity, Modal, Pressable, ImageBackground, Dimensions } from "react-native";
import { Text, Button, TextInput, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { onAuthStateChanged, User, updateProfile, getAuth } from "firebase/auth";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
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
import UserItineraries from "./user_itineraries";
import type { Itinerary } from "./user_itineraries";
import { itinerarySubTabStyles } from "./user_itineraries.styles";
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
  const [expandedReview, setExpandedReview] = useState<{ [key: string]: boolean }>({});
  const [userFavorites, setUserFavorites] = useState<{ [key: string]: boolean }>({});
  const [openItinerary, setOpenItinerary] = useState<Itinerary | null>(null);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [newActivity, setNewActivity] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addedUserId, setAddedUserId] = useState<string | null>(null);
  const [sharedUsernames, setSharedUsernames] = useState<string[]>([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);



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

  const UserPosts = ({ onOpenPost }: { onOpenPost: (post: Post) => void }) => {
    const [posts, setPosts] = useState<Post[]>([]); //initializes post as an empty array which is then updated by setPosts
    const [loading, setLoading] = useState(true);
    const doubleTap = useRef<number | null>(null);
    const [openPost, setOpenPost] = useState<Post | null>(null);

    useEffect(() => {
      if (!user) {
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
        setLoading(false);
      });
      return () => unsubscribe();
    }, [user]);

    if (loading) {
      return (
        <View style={itinerarySubTabStyles.itineraryLoading}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={itinerarySubTabStyles.itineraryEmpty}>
          <Text>No posts found.</Text>
        </View>
      );
    }

    return (
      <>
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            {posts.map((post) => {
              const imageUrl = post.urls?.[0];
              return (
                <View
                  key={post.id}
                  style={itinerarySubTabStyles.itineraryGrid}
                >
                  <Pressable
                    onPress={() => {
                      const now = Date.now();
                      if (doubleTap.current && now - doubleTap.current < 300) {
                        onOpenPost(post);
                      }
                      doubleTap.current = now;
                    }}
                  >
                    <ImageBackground
                      source={imageUrl ? { uri: imageUrl } : undefined}
                      style={itinerarySubTabStyles.itineraryCard}
                    >
                      <View style={itinerarySubTabStyles.itineraryCardBlurContainer}>
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
                        <View style={itinerarySubTabStyles.itineraryCardTextContainer}>
                          <Text style={itinerarySubTabStyles.itineraryCityText}>
                            {post.city?.name}, {post.city?.country}
                          </Text>
                        </View>
                      </View>

                    </ImageBackground>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  };
  const handleSearchUsers = async (text: string) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setSearchResults([]);
      return;
    }

    const lower = text.toLowerCase();
    const upper = text.charAt(0).toUpperCase() + text.slice(1);

    const q1 = query(
      collection(FIREBASE_DB, "users"),
      where("username", ">=", lower),
      where("username", "<=", lower + "\uf8ff")
    );

    const q2 = query(
      collection(FIREBASE_DB, "users"),
      where("username", ">=", upper),
      where("username", "<=", upper + "\uf8ff")
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const results = [...snap1.docs, ...snap2.docs]
      .map((doc) => ({
        uid: doc.id,
        username: doc.data().username,
      }))
      .filter(
        (v, i, a) => a.findIndex((t) => t.uid === v.uid) === i // Remove duplicates.
      );

    setSearchResults(results);
  };




  const handleAddUserToItinerary = async (userToAdd: any) => {
    if (!selectedItinerary) return;

    try {
      // Get the specific itinerary data for the itinerary to share.
      const itinRef = doc(FIREBASE_DB, "itineraries", selectedItinerary.id);
      // Then, we will update the field of the shared with to add this new user.
      await updateDoc(itinRef, {
        sharedWith: arrayUnion(userToAdd.uid),
      });

      console.log("User added to itinerary!");
    } catch (e) {
      console.error("Error adding user:", e);
    }
  };

  const addActivityToItinerary = async () => {
    if (!openItinerary || !newActivity.trim()) return;

    const itinRef = doc(FIREBASE_DB, "itineraries", openItinerary.id);

    const newActivityObj = {
      name: newActivity.trim(),
      likes: [],
    };

    await updateDoc(itinRef, {
      activities: [...openItinerary.activities, newActivityObj],
      updatedAt: new Date(),
    });

    setNewActivity("");
  };


  const handleSelectUser = async (user: any) => {
    await handleAddUserToItinerary(user);

    setAddedUserId(user.uid);

    setTimeout(() => {
      setAddedUserId(null);
      setSearchQuery("");
      setSearchResults([]);
    }, 800);
  };

  const handleToggleLike = async (index: number) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !openItinerary) return;

    const userId = currentUser.uid;
    const activity = openItinerary.activities[index];
    const alreadyLiked = activity.likes.includes(userId);

    const updatedLikes = alreadyLiked
      ? activity.likes.filter((id) => id !== userId)
      : [...activity.likes, userId];

    const updatedActivities = [...openItinerary.activities];
    updatedActivities[index] = {
      ...activity,
      likes: updatedLikes,
    };

    const itineraryRef = doc(FIREBASE_DB, "itineraries", openItinerary.id);
    await updateDoc(itineraryRef, { activities: updatedActivities });

    setOpenItinerary((prev) => ({
      ...prev!,
      activities: updatedActivities,
    }));
  };



  useEffect(() => {
    if (!openItinerary) return;

    const itinRef = doc(FIREBASE_DB, "itineraries", openItinerary.id);

    const unsub = onSnapshot(itinRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;

        setOpenItinerary({
          id: snapshot.id,
          ...data,
          imageUrl: openItinerary.imageUrl,
        });
      }
    });

    return () => unsub();
  }, [openItinerary?.id]);

  useEffect(() => {
    if (!openItinerary) return;

    const fetchSharedUsers = async () => {
      try {
        const usernames: string[] = [];

        for (const uid of openItinerary.sharedWith) {
          const userRef = doc(FIREBASE_DB, "users", uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            usernames.push(snap.data().username);
          }
        }

        setSharedUsernames(usernames);
      } catch (e) {
        console.error("Error fetching shared users:", e);
      }
    };

    fetchSharedUsers();
  }, [openItinerary]);
  useEffect(() => {
    if (!openItinerary) return;

    const fetchOwnerUsername = async () => {
      try {
        const userRef = doc(FIREBASE_DB, "users", openItinerary.ownerId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setOwnerUsername(snap.data().username);
        }
      } catch (e) {
        console.error("Error fetching owner username:", e);
      }
    };

    fetchOwnerUsername();
  }, [openItinerary]);

  useEffect(() => {
    if (!shareModalOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setAddedUserId(null);
    }
  }, [shareModalOpen]);
  let sharedWithSentence = "no one yet";

  if (openItinerary && currentUser) {
    const isOwner = currentUser.uid === openItinerary.ownerId;

    if (isOwner) {
      // Owner view - show who they shared with.
      sharedWithSentence =
        sharedUsernames.length > 0
          ? sharedUsernames.join(", ")
          : "no one yet";
    } else {
      // Show owner.
      sharedWithSentence = ownerUsername ?? "the owner";
    }
  }




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
      <View style={{ flex: 1, marginTop: -500, }}>
        <subTab.Navigator
          screenOptions={{
            tabBarIndicatorStyle: {
              backgroundColor: "#000",
              height: 3,
              borderRadius: 2,
              alignContent: "center",
            },
            tabBarLabelStyle: { fontSize: 20, fontWeight: "600" },
            tabBarStyle: { backgroundColor: "transparent" },
          }}
        >
          <subTab.Screen
            name="Posts"
            children={() => (
              <View style={{ flex: 1, backgroundColor: "#fff" }}>
                <UserPosts onOpenPost={setOpenPost} />
              </View>
            )}
          />

          <subTab.Screen
            name="Itineraries"
            children={() => (
              <View style={{ flex: 1, backgroundColor: "#fff" }}>
                <UserItineraries
                  onOpenItinerary={setOpenItinerary}
                  onOpenShareModal={(itin) => {
                    setSelectedItinerary(itin);
                    setShareModalOpen(true);
                  }}
                />

              </View>
            )}
          />

        </subTab.Navigator>
      </View>
      {openItinerary && (
        <View style={styles.cityModalContainer}>
          <ScrollView contentContainerStyle={styles.cityModalContent}>
            {openItinerary.imageUrl ? (
              <Image
                source={{ uri: openItinerary.imageUrl }}
                style={styles.cityModalImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cityModalImage, { backgroundColor: "#e0e0e0" }]} /> // Fallback if image doesn't load.
            )}


            <Text style={styles.cityModalTitle}>
              {openItinerary.city}, {openItinerary.country}
            </Text>

            <Text style={itinerarySubTabStyles.sharedWithText}>
              Shared with: <Text style={itinerarySubTabStyles.sharedWithNames}>{sharedWithSentence}</Text>
            </Text>

            <View style={itinerarySubTabStyles.activitiesContainer}>
              {openItinerary.activities.map((a, i) => (
                <View key={i} style={itinerarySubTabStyles.activityRow}>
                  <Text style={itinerarySubTabStyles.activityBullet}>•</Text>

                  <Text style={itinerarySubTabStyles.activityText}>
                    {a.name}
                  </Text>

                  <TouchableOpacity onPress={() => handleToggleLike(i)}>
                    <Ionicons
                      name={
                        a.likes.includes(currentUser?.uid ?? "")
                          ? "thumbs-up"
                          : "thumbs-up-outline"
                      }
                      size={20}
                      color={
                        a.likes.includes(currentUser?.uid ?? "")
                          ? "#007AFF"
                          : "#666"
                      }
                    />

                  </TouchableOpacity>

                  <Text style={itinerarySubTabStyles.likeCount}>
                    {a.likes.length}
                  </Text>
                </View>

              ))}
            </View>

            <TextInput
              placeholder="Add an activity..."
              value={newActivity}
              onChangeText={setNewActivity}
              style={profileStyles.activityInput}
              mode="outlined"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              caretHidden={false}
              selectionColor="#000"
              outlineColor="#000"
              theme={inputTheme}
              autoCapitalize="none"

            />

            <Button mode="contained" onPress={addActivityToItinerary} style={styles.cityModalCloseBtn}>
              Add Activity
            </Button>
          </ScrollView>

          <TouchableOpacity
            style={profileStyles.closeButton}
            onPress={() => setOpenItinerary(null)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      {shareModalOpen && (
        <View style={itinerarySubTabStyles.searchModalContainer}>
          <ScrollView contentContainerStyle={styles.cityModalContent}>
            <TouchableOpacity
              style={profileStyles.closeButtonShared}
              onPress={() => setShareModalOpen(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={itinerarySubTabStyles.shareTitle}>
              Share {selectedItinerary?.city}, {selectedItinerary?.country}
            </Text>

            <TextInput
              placeholder="Search username..."
              value={searchQuery}
              onChangeText={handleSearchUsers}
              style={profileStyles.sharedInput}
              mode="outlined"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              caretHidden={false}
              selectionColor="#000"
              outlineColor="#000"
              theme={inputTheme}
              autoCapitalize="none"
              left={
                <TextInput.Icon
                  icon="magnify"
                  color="#000"
                />
              }
            />





            <ScrollView style={{ maxHeight: 250, marginTop: 10 }}>
              {searchResults.map((user) => (
                <TouchableOpacity
                  key={user.uid}
                  style={itinerarySubTabStyles.searchResultRow}
                  onPress={() => handleSelectUser(user)}
                >
                  <Text style={itinerarySubTabStyles.searchResultUsername}>
                    {user.username}
                  </Text>
                  {addedUserId === user.uid &&
                    (
                      <Ionicons name="checkmark-circle" size={22} color="green" />
                    )}
                </TouchableOpacity>

              ))}

              {searchQuery && searchResults.length === 0 && (
                <Text>No users found.</Text>
              )}
            </ScrollView>


          </ScrollView>
        </View>
      )}

      {openPost && (
        <Modal visible={true} transparent animationType = "slide">
          <View style = {{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <View style = {{
              width: "90%",
              maxHeight: "80%",
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <FlatList
                data= {openPost.urls}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, index) => uri + index}
                renderItem={({item}) => (
                  <Image
                    source = {{uri: item}}
                    style={{width: Dimensions.get("window").width*0.9, height: 300}}
                    resizeMode= "cover"
                  />
                )}
              />
              <FlatList
                data={[openPost]}
                keyExtractor={item => item.id}
                contentContainerStyle={{padding: 10}}
                renderItem={({item}) => (
                  <>
                    <Text style = {styles.cityModalTitle}>
                      {openPost.city?.name}, {openPost.city?.country}
                    </Text>
                    <Text style={{marginTop:10}}>
                      {openPost.review}
                    </Text>
                      <Text style={{marginTop:10}}>
                        Ratng: {openPost.ratingValue?.toFixed(1)}
                      </Text>
                    <Button
                      mode="contained"
                      onPress={() => setOpenPost(null)}
                      style={styles.cityModalCloseBtn}
                    >
                      Close
                    </Button>
                  </>
                )}
              />
            </View>
        </View>
      </Modal>
      )}

    </View>
  );
};

export default Profile;
