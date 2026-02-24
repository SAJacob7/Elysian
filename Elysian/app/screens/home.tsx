/**
 * file: home.tsx
 *
 * This file renders the main Explore page where users can browse
 * images shared by others and upload their own travel photos.
 *
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./app_styles.styles";
import { homeStyles } from "./home.styles";
import { FIREBASE_DB } from "../../FirebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassView } from "expo-glass-effect";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./navigation_bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { deleteField } from "firebase/firestore";

// Post type now matches create post 
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

type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedReview, setExpandedReview] = useState<{ [key: string]: boolean }>({});
  const [userFavorites, setUserFavorites] = useState<{ [key: string]: boolean }>({});
  const navigation = useNavigation<HomeNavigationProp>();

  // Sync posts from Firestore
  useEffect(() => {
    const q = query(
      collection(FIREBASE_DB, "posts"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Post, "id">),
      }));
      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  // Sync userFavorites from Firestore 
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const userFavoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);

    const unsubscribe = onSnapshot(userFavoritesRef, (snapshot) => {
      const data = snapshot.data() || {};
      const favs: { [key: string]: boolean } = {};
      Object.keys(data).forEach((key) => {
        favs[key] = true;
      });
      setUserFavorites(favs);
    });

    return () => unsubscribe();
  }, []);

  const uploadMethod = () => {
    Alert.alert(
      "Create a Post",
      "Choose Upload Options:",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Album", onPress: fromAlbum },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera access is required.");
      return;
    }

    const selectedImage = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!selectedImage.canceled) {
      createPost([selectedImage.assets[0].uri]);
    }
  };

  const fromAlbum = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Need access to photos in order to upload images"
      );
      return;
    }

    const selectedImage = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (!selectedImage.canceled) {
      const uris = selectedImage.assets.map((a: { uri: string }) => a.uri);
      createPost(uris);
    }
  };

  const createPost = (localURIs: string[]) => {
    navigation.navigate("CreatePost", { imageURIs: localURIs });
  };

  const handleReview = (postId: string) => {
    setExpandedReview(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Add city to userFavorites 
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

  // Remove city from userFavorites
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

  return (
    <SafeAreaView edges={["top"]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={homeStyles.homeContainer}
        ListHeaderComponent={
          <Text style={styles.pageTitle}>
            Explore{"\n"}with Us
          </Text>
        }
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

      {/* Upload button */}
      <TouchableOpacity
        style={styles.topRightIcon}
        onPress={uploadMethod}
      >
        <GlassView style={styles.glassButton}>
          <Ionicons name="add" size={26} color="#000" />
        </GlassView>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;