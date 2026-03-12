/* 
File: user_itineraries.tsx
Function: This is the user's itineraries subtab screen component for the Profile page. 
*/
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
} from "react-native";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { styles } from "./styles/app_styles.styles";
import { TextInput } from "react-native-paper";
import { itinerarySubTabStyles } from "./styles/user_itineraries.styles";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { profileStyles } from "./styles/profile.styles";
import { getAuth } from "firebase/auth";
import { GlassView } from "expo-glass-effect";

export type Itinerary = {
  id: string;
  activities: Activity[];
  city: string;
  country: string;
  imageUrl?: string | null;
  ownerId: string;
  sharedWith: string[];
};

export type Activity = {
  name: string;
  likes: string[];
};

const fetchUnsplashImage = async (cityName: string, country: string) => {
  try {
    const url =
      `https://capstone-team-generated-group30-project.onrender.com/api/city-image?city=${encodeURIComponent(
        cityName,
      )}` + `&country=${encodeURIComponent(country)}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.log("Fetch failed:", res.status);
      return null;
    }

    const json = await res.json();

    console.log("API response:", json);

    return json?.data?.imageUrl ?? null;
  } catch (e) {
    console.error("Unsplash fetch error:", e);
    return null;
  }
};

const UserItineraries = () => {
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsplashImageUrl, setUnsplashImageUrl] = useState<{
    [key: string]: string | null;
  }>({});

  const [openItinerary, setOpenItinerary] = useState<Itinerary | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(
    null,
  );
  const [newActivity, setNewActivity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addedUserId, setAddedUserId] = useState<string | null>(null);
  const [sharedUsernames, setSharedUsernames] = useState<string[]>([]);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const doubleTap = useRef<number | null>(null);

  /* ------------------ HOOKS ------------------ */

  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) return;

    const qOwned = query(
      collection(FIREBASE_DB, "itineraries"),
      where("ownerId", "==", currentUser.uid),
    );

    const qShared = query(
      collection(FIREBASE_DB, "itineraries"),
      where("sharedWith", "array-contains", currentUser.uid),
    );

    const unsubOwned = onSnapshot(qOwned, async (ownedSnap) => {
      const ownedData = ownedSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      const imageGet = ownedData.map(async (itin) => {
        const img = await fetchUnsplashImage(itin.city, itin.country);
        return { id: itin.id, img };
      });

      const result_images = await Promise.all(imageGet);
      const imageMap: { [key: string]: string | null } = {};
      result_images.forEach((r) => {
        imageMap[r.id] = r.img;
      });

      setUnsplashImageUrl((prev) => ({ ...prev, ...imageMap }));
      setItineraries((prev) => [
        ...ownedData,
        ...prev.filter((i) => i.ownerId !== currentUser.uid),
      ]);
      setLoading(false);
    });

    const unsubShared = onSnapshot(qShared, async (sharedSnap) => {
      const sharedData = sharedSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      const imageGet = sharedData.map(async (itin) => {
        const img = await fetchUnsplashImage(itin.city, itin.country);
        return { id: itin.id, img };
      });

      const result_images = await Promise.all(imageGet);
      const imageMap: { [key: string]: string | null } = {};
      result_images.forEach((r) => {
        imageMap[r.id] = r.img;
      });

      setUnsplashImageUrl((prev) => ({ ...prev, ...imageMap }));
      setItineraries((prev) => [
        ...prev.filter((i) => i.ownerId === currentUser.uid),
        ...sharedData,
      ]);
    });

    return () => {
      unsubOwned();
      unsubShared();
    };
  }, []);

  useEffect(() => {
    if (!openItinerary) return;
    const itinRef = doc(FIREBASE_DB, "itineraries", openItinerary.id);

    const unsub = onSnapshot(itinRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setOpenItinerary((prev) => ({ ...prev!, ...data }));
      }
    });
    return () => unsub();
  }, [openItinerary?.id]);

  useEffect(() => {
    if (!openItinerary) return;
    const fetchSharedUsers = async () => {
      const usernames: string[] = [];
      for (const uid of openItinerary.sharedWith) {
        const snap = await getDoc(doc(FIREBASE_DB, "users", uid));
        if (snap.exists()) usernames.push(snap.data().username);
      }
      setSharedUsernames(usernames);
    };
    fetchSharedUsers();
  }, [openItinerary]);

  useEffect(() => {
    if (!openItinerary) return;
    const fetchOwnerUsername = async () => {
      const snap = await getDoc(
        doc(FIREBASE_DB, "users", openItinerary.ownerId),
      );
      if (snap.exists()) setOwnerUsername(snap.data().username);
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

  /* ------------------ FUNCTIONS ------------------ */

  const handleSearchUsers = async (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") return setSearchResults([]);

    if (!selectedItinerary) return;
    // Fetch itinerary data
    const itinSnap = await getDoc(
      doc(FIREBASE_DB, "itineraries", selectedItinerary.id),
    );
    if (!itinSnap.exists()) return;
    const itinData = itinSnap.data() as any;
    const { sharedWith = [], ownerId } = itinData;

    const lower = text.toLowerCase();
    const upper = text.charAt(0).toUpperCase() + text.slice(1);

    const q1 = query(
      collection(FIREBASE_DB, "users"),
      where("username", ">=", lower),
      where("username", "<=", lower + "\uf8ff"),
    );
    const q2 = query(
      collection(FIREBASE_DB, "users"),
      where("username", ">=", upper),
      where("username", "<=", upper + "\uf8ff"),
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const results = [...snap1.docs, ...snap2.docs]
      .map((doc) => ({ uid: doc.id, username: doc.data().username }))
      .filter((v, i, a) => a.findIndex((t) => t.uid === v.uid) === i)
      // Remove users already shared and the owner
      .filter((v) => !sharedWith.includes(v.uid) && v.uid !== ownerId);

    setSearchResults(results);
  };

  const handleAddUserToItinerary = async (userToAdd: any) => {
    if (!selectedItinerary) return;
    const itinRef = doc(FIREBASE_DB, "itineraries", selectedItinerary.id);
    await updateDoc(itinRef, { sharedWith: arrayUnion(userToAdd.uid) });
    setAddedUserId(userToAdd.uid);
    setTimeout(() => setAddedUserId(null), 800);
  };

  const handleSelectUser = async (user: any) => {
    await handleAddUserToItinerary(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  const addActivityToItinerary = async () => {
    if (!openItinerary || !newActivity.trim()) return;
    const itinRef = doc(FIREBASE_DB, "itineraries", openItinerary.id);
    const newActivityObj = { name: newActivity.trim(), likes: [] };
    await updateDoc(itinRef, {
      activities: [...openItinerary.activities, newActivityObj],
      updatedAt: new Date(),
    });
    setNewActivity("");
  };

  const handleToggleLike = async (index: number) => {
    if (!currentUser || !openItinerary) return;
    const activity = openItinerary.activities[index];
    const alreadyLiked = activity.likes.includes(currentUser.uid);
    const updatedActivities = [...openItinerary.activities];
    updatedActivities[index] = {
      ...activity,
      likes: alreadyLiked
        ? activity.likes.filter((id) => id !== currentUser.uid)
        : [...activity.likes, currentUser.uid],
    };
    await updateDoc(doc(FIREBASE_DB, "itineraries", openItinerary.id), {
      activities: updatedActivities,
    });
    setOpenItinerary((prev) => ({ ...prev!, activities: updatedActivities }));
  };

  const sharedUsernameList =
    sharedUsernames.length > 0
      ? sharedUsernames.map((username) => `@${username}`).join(", ")
      : "None";

  if (loading) {
    return (
      <View style={itinerarySubTabStyles.itineraryEmpty}>
        <Image
          source={require("../../assets/penguin.png")}
          style={profileStyles.emptyPageImage}
          resizeMode="contain"
        />
        <Text style={itinerarySubTabStyles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (itineraries.length === 0) {
    return (
      <View style={itinerarySubTabStyles.itineraryEmpty}>
        <Image
          source={require("../../assets/penguin.png")}
          style={profileStyles.emptyPageImage}
          resizeMode="contain"
        />
        <Text style={itinerarySubTabStyles.emptyText}>
          No Itineraries Created
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ flex: 1 }}>
        <View style={profileStyles.scrollContainer}>
          {itineraries.map((itin) => {
            const imageUrl = unsplashImageUrl[itin.id];

            return (
              <View key={itin.id} style={profileStyles.scrollGrid}>
                <Pressable
                  onPress={() => {
                    const now = Date.now();
                    if (doubleTap.current && now - doubleTap.current < 300) {
                      setOpenItinerary({
                        ...itin,
                        imageUrl: unsplashImageUrl[itin.id] ?? null,
                      });
                    }
                    doubleTap.current = now;
                  }}
                >
                  <ImageBackground
                    source={imageUrl ? { uri: imageUrl } : undefined}
                    style={profileStyles.scrollCard}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedItinerary(itin);
                        setShareModalOpen(true);
                      }}
                    >
                      <View style={itinerarySubTabStyles.shareOverlay}>
                        <View style={itinerarySubTabStyles.shareTag}>
                          <Ionicons name="person-add" size={17} color="#000" />
                        </View>
                      </View>
                    </TouchableOpacity>

                    <View style={profileStyles.scrollCardBlurContainer}>
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

                      <View style={profileStyles.cardCityTextContainer}>
                        <Text style={profileStyles.cardCityText}>
                          {itin.city}, {"\n"}
                          {itin.country}
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

      {/* ITINERARY MODAL */}
      <Modal
        visible={!!openItinerary}
        animationType="fade"
        transparent
        onRequestClose={() => setOpenItinerary(null)}
      >
        {openItinerary && (
          <View style={styles.modalDimOverlay}>
            <Pressable
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
              onPress={() => setOpenItinerary(null)}
            />

            <View style={styles.cityModalContainer}>
              <ScrollView contentContainerStyle={styles.cityModalContent}>
                {openItinerary.imageUrl ? (
                  <Image
                    source={{ uri: openItinerary.imageUrl }}
                    style={styles.cityModalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.cityModalImage,
                      { backgroundColor: "#e0e0e0" },
                    ]}
                  />
                )}

                <Text style={styles.cityModalTitle}>
                  {openItinerary.city}, {openItinerary.country}
                </Text>

                <Text style={itinerarySubTabStyles.sharedWithText}>
                  Created by:{" @"}
                  <Text style={itinerarySubTabStyles.sharedWithNames}>
                    {ownerUsername}
                  </Text>
                </Text>

                <Text style={itinerarySubTabStyles.sharedWithText}>
                  Shared with:{" "}
                  <Text style={itinerarySubTabStyles.sharedWithNames}>
                    {sharedUsernameList}
                  </Text>
                </Text>
                <Text style={itinerarySubTabStyles.activityLabelText}>
                  Activities:
                </Text>

                <View style={itinerarySubTabStyles.activitiesContainer}>
                  {openItinerary.activities.map((a, i) => (
                    <View key={i} style={itinerarySubTabStyles.activityRow}>
                      <Text style={itinerarySubTabStyles.activityBullet}>
                        •
                      </Text>

                      <Text style={itinerarySubTabStyles.activityText}>
                        {a.name}
                      </Text>

                      {/* Right side fixed container */}
                      <View style={itinerarySubTabStyles.likeContainer}>
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
                                ? "#33375D"
                                : "#807f7fff"
                            }
                          />
                        </TouchableOpacity>

                        <Text style={itinerarySubTabStyles.likeCount}>
                          {a.likes.length}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={{ overflow: "hidden" }}>
                  <View style={itinerarySubTabStyles.addActivityContainer}>
                    {/* Glass pill input */}
                    <GlassView style={itinerarySubTabStyles.activityInputBar}>
                      <TextInput
                        placeholder="Add an activity..."
                        placeholderTextColor="#666"
                        value={newActivity}
                        onChangeText={setNewActivity}
                        style={styles.searchInput}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        caretHidden={false}
                        selectionColor="#000"
                      />
                    </GlassView>

                    {/* Glass circular + button */}
                    <TouchableOpacity
                      onPress={addActivityToItinerary}
                      activeOpacity={0.8}
                      style={{ marginLeft: 10 }}
                    >
                      <GlassView style={styles.glassButton}>
                        <Ionicons name="add" size={24} color="#000" />
                      </GlassView>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* SHARE MODAL */}
      <Modal
        visible={shareModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalOpen(false)}
      >
        <View style={styles.modalDimOverlay}>
          <Pressable
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
            onPress={() => setShareModalOpen(false)}
          />

          <View style={itinerarySubTabStyles.searchModalContainer}>
            <View style={{ flex: 1, width: "100%" }}>
              <TouchableOpacity
                style={profileStyles.closeButtonShared}
                onPress={() => setShareModalOpen(false)}
              >
                <GlassView style={styles.glassButton}>
                  <Ionicons name="close" size={26} color="#000" />
                </GlassView>
              </TouchableOpacity>

              <Text style={itinerarySubTabStyles.shareTitle}>
                Share Itinerary
              </Text>
              <Text style={itinerarySubTabStyles.shareCitySubtitle}>
                {selectedItinerary?.city}, {selectedItinerary?.country}
              </Text>
              <GlassView style={itinerarySubTabStyles.sharedInputBar}>
                <TextInput
                  placeholder="Search username..."
                  value={searchQuery}
                  onChangeText={handleSearchUsers}
                  style={styles.searchInput}
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor="#eee"
                  autoFocus
                  caretHidden={false}
                  selectionColor="#000"
                />
              </GlassView>
              {searchQuery ? (
                <View style={{ maxHeight: 180 }}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <TouchableOpacity
                          key={user.uid}
                          style={itinerarySubTabStyles.searchResultRow}
                          onPress={() => handleSelectUser(user)}
                        >
                          {/* Username */}
                          <Text
                            style={itinerarySubTabStyles.searchResultUsername}
                          >
                            @{user.username}
                          </Text>

                          {/* Add icon */}
                          <Ionicons name="add" size={24} color="#333" />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={itinerarySubTabStyles.searchResultRow}>
                        <Text style={styles.searchResultNoneText}>
                          No Users Found
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserItineraries;
