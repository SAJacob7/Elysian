/**
 * File: favorites.tsx
 *
 * This file renders the Favorites page where users can view, add,
 * and remove cities they have liked. Favorite cities are loaded
 * from Firebase in real time so the screen stays updated.
 *
 * Users can search for new cities to favorite, open a city to see
 * more details and manage their saved places.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Image,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Modal, Button, TextInput } from "react-native-paper";
import { styles } from "./app_styles.styles";
import { favoritesStyles } from "./favorites.styles";

import { getAuth } from "firebase/auth";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  setDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { GlassView } from "expo-glass-effect";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import PenguinLoader from "./penguin_loader";

interface Recommendation {
  city_id: string;
  city_name: string;
  country: string;
  score?: number; // Score is optional here
  description?: string;
  image?: string;
}

interface City {
  id: string;
  name: string;
  country: string;
}

// Favorites component
const Favorites = () => {
  const [favorites, setFavorites] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCity, setSelectedCity] = useState<Recommendation | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);

  // Fetches all cities in the training set from Firebase.
  // This sets the list of all cities users can search for to favorite.
  const fetchAllCities = async () => {
    try {
      const citiesCol = collection(FIREBASE_DB, "allCities");
      const snapshot = await getDocs(citiesCol);

      const citiesList: City[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().city_name,
        country: doc.data().country_name,
      }));

      setCities(citiesList);
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Screen focused → do nothing

      return () => {
        // Screen blurred → reset UI state
        setSearchOpen(false);
        setSearchQuery("");
        setDropdownOpen(false);
      };
    }, [])
  );

  // Calls fetchAllCities on page init
  useEffect(() => {
    fetchAllCities();
  }, []);

  // Adds a city to userFavorites.
  // This is for when users select a city in the search bar.
  const addToFavorites = async (city: City) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.warn("User not signed in!");
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

  // Only uses Wikipedia REST API
  const fetchCityImage = async (cityName: string, country: string) => {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        `${cityName}, ${country}`
      )}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const data = await res.json();

      // Avoid flag images
      const rawImage = data.originalimage?.source || data.thumbnail?.source;
      if (!rawImage) return undefined;
      const lower = rawImage.toLowerCase();
      if (lower.includes("flag") || lower.includes("flag_of")) return undefined;

      return rawImage;
    } catch (err) {
      console.error("Error fetching city image:", err);
      return undefined;
    }
  };

  const fetchUnsplashImage = async (cityName: string, country: string) => {
    try {
      const url =
        `https://capstone-team-generated-group30-project.onrender.com/api/city-image?city=${encodeURIComponent(
          cityName
        )}` + `&country=${encodeURIComponent(country)}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const json = await res.json();
      return json?.data?.imageUrl ?? null;
    } catch (e) {
      console.error("Unsplash fetch error:", e);
      return null;
    }
  };

  const fetchCityDescription = async (cityName: string, country: string) => {
    try {
      // 1) We try the Wikivoyage first (it's more travel/aesthetic)
      const tryTitles = [
        cityName,
        `${cityName} (${country})`,
        `${cityName}, ${country}`,
      ];

      for (const title of tryTitles) {
        const voyageUrl =
          `https://en.wikivoyage.org/w/api.php` +
          `?action=query&prop=extracts&exintro=1&explaintext=1` +
          `&titles=${encodeURIComponent(title)}` +
          `&format=json&origin=*`;

        const voyageRes = await fetch(voyageUrl);
        if (voyageRes.ok) {
          const voyageData = await voyageRes.json();
          const pages = voyageData?.query?.pages;
          const firstPage = pages ? pages[Object.keys(pages)[0]] : null;
          const extract = firstPage?.extract;

          if (extract && extract.trim().length > 0) {
            return extract;
          }
        }
      }

      // 2) If Wikivoyage doesn't work then we fallback to Wikipedia (reliable if Wikivoyage has no page)
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        `${cityName}, ${country}`
      )}`;

      const wikiRes = await fetch(wikiUrl);
      if (!wikiRes.ok) return undefined;

      const wikiData = await wikiRes.json();
      return wikiData.extract || undefined;
    } catch (err) {
      console.error("Error fetching city description:", err);
      return undefined;
    }
  };

  // Removes city from Favorites.
  const removeFavorite = async (city: Recommendation) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const favoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);
      const dislikesRef = doc(FIREBASE_DB, "userDislikes", user.uid);

      // 1) Remove from favorites
      await updateDoc(favoritesRef, {
        [city.city_id]: deleteField(),
      });

      // 2) Add to dislikes (merge so we don't overwrite existing dislikes)
      await setDoc(
        dislikesRef,
        {
          [city.city_id]: {
            city_name: city.city_name,
            country_name: city.country,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  // Use navigation system for search bar icon
  const navigation = useNavigation();

  // When handleSeachbar is called (search bar icon pressed) it goes to itinerary.tsx page
  const handleItinerary = () => {
    navigation.navigate("Itinerary" as never);
  };

  // Load liked locations from Firestore.
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("No user signed in.");
      return;
    }

    setLoading(true);

    const favoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);

    const unsubscribe = onSnapshot(
      favoritesRef,
      async (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setFavorites([]);
            setError("No favorites found.");
            setLoading(false);
            return;
          }

          setError(null);

          const cityData = snapshot.data() || {};

          const favoritesArray: Recommendation[] = await Promise.all(
            Object.keys(cityData).map(async (key) => {
              const city = cityData[key];
              let image = city.image;

              if (!image) {
                // Try Unsplash first
                image = await fetchUnsplashImage(
                  city.city_name,
                  city.country_name
                );

                // Fallback to Wikipedia if needed
                if (!image) {
                  image = await fetchCityImage(
                    city.city_name,
                    city.country_name
                  );
                }

                if (image && image.includes("images.unsplash.com")) {
                  await updateDoc(favoritesRef, {
                    [`${key}.image`]: image,
                  });
                }
              }
              const description = await fetchCityDescription(
                city.city_name,
                city.country_name
              );

              return {
                city_id: key,
                city_name: city.city_name,
                country: city.country_name,
                image,
                description,
              };
            })
          );

          setFavorites(favoritesArray);
        } catch (err) {
          console.error("Error building favorites array:", err);
          setError("Failed to load liked places.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setError("Failed to load liked places.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Itinerary Icon (hidden when search is open) */}
      {!searchOpen && (
        <TouchableOpacity
          style={favoritesStyles.itineraryIcon}
          onPress={() => handleItinerary()}
        >
          <GlassView style={styles.glassButton}>
            <Ionicons name="list" size={26} color="#000" />
          </GlassView>
        </TouchableOpacity>
      )}

      {/* Search Icon and Bar */}
      <View style={styles.searchOverlay}>
        {/* Absolute search icon */}

        <TouchableOpacity
          style={styles.topRightIcon}
          onPress={() => setSearchOpen((prev) => !prev)}
        >
          <GlassView style={styles.glassButton}>
            <Ionicons name="search" size={26} color="#000" />
          </GlassView>
        </TouchableOpacity>

        {/* Expanded search bar behind the icon */}
        {searchOpen && (
          <GlassView style={styles.searchBarExpanded}>
            <TextInput
              placeholder="Search cities..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setDropdownOpen(true);
              }}
              style={styles.searchInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              autoFocus
              caretHidden={false}
              selectionColor="#000"
            />
          </GlassView>
        )}
      </View>

      {/* Tap outside to close search */}
      {searchOpen && (
        <Pressable
          style={styles.searchBackdrop}
          onPress={() => {
            setSearchOpen(false);
            setSearchQuery("");
            setDropdownOpen(false);
          }}
        />
      )}

      {/* Dropdown Results */}
      {searchOpen && dropdownOpen && searchQuery.length > 0 && (
        <GlassView style={styles.searchDropdown}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {cities.filter((city) =>
              `${city.name}, ${city.country}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            ).length > 0 ? (
              cities
                .filter((city) =>
                  `${city.name}, ${city.country}`
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      addToFavorites(city); // Add to userFavorites
                      setSearchOpen(false); // Close search bar
                      setSearchQuery(""); // Clear text
                      setDropdownOpen(false); // Close dropdown
                    }}
                  >
                    <Text>
                      {city.name}, {city.country}
                    </Text>
                  </TouchableOpacity>
                ))
            ) : (
              <View style={styles.searchResultItem}>
                <Text style={{ color: "#888" }}>No Results</Text>
              </View>
            )}
          </ScrollView>
        </GlassView>
      )}

      {/* Favorites list */}
      {!searchOpen && (
        <ScrollView contentContainerStyle={styles.homeContainer}>
          <Text variant="headlineLarge" style={styles.pageTitle}>
            Favorites
          </Text>

          {loading && (
            <PenguinLoader text="Loading your favorite cities!" />
          )}
          {error && !loading && <Text>{error}</Text>}

          {!loading && favorites.length > 0 && (
            <View style={favoritesStyles.resultsContainer}>
              {favorites.map((city) => (
                <Pressable
                  key={city.city_id}
                  onPress={() => {
                    setSelectedCity(city);
                    setCityModalOpen(true);
                  }}
                  style={favoritesStyles.cityCard}
                >
                  {city.image ? (
                    <Image
                      source={{ uri: city.image }}
                      style={favoritesStyles.cityCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={favoritesStyles.cityCardPlaceholder} />
                  )}

                  {/* Progressive Blur on bottom 1/3 */}
                  <View style={favoritesStyles.cityCardBlurContainer}>
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

                  {/* Text on top of blurred area */}
                  <View style={favoritesStyles.cityCardTextContainer}>
                    <Text style={favoritesStyles.cityCardText}>
                      {city.city_name}, {city.country}
                    </Text>
                  </View>

                  {/* Remove favorite icon */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      removeFavorite(city);
                    }}
                    style={[
                      favoritesStyles.removeIconBtn,
                      favoritesStyles.removeIconBtnShadow,
                    ]}
                  >
                    <Ionicons name="bookmark" size={18} color="#fff" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Full-screen dim overlay */}
      {cityModalOpen && (
        <Pressable
          style={styles.cityModalOverlay}
          onPress={() => setCityModalOpen(false)}
        />
      )}

      {/* Modal content on top of overlay */}
      {cityModalOpen && selectedCity && (
        <View style={styles.cityModalContainer}>
          <ScrollView contentContainerStyle={styles.cityModalContent}>
            <Text style={styles.cityModalTitle}>
              {selectedCity.city_name}, {selectedCity.country}
            </Text>

            {selectedCity.image && (
              <Image
                source={{ uri: selectedCity.image }}
                style={styles.cityModalImage}
                resizeMode="cover"
              />
            )}

            <Text style={styles.cityModalDescription}>
              {selectedCity.description || "No description available."}
            </Text>
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => setCityModalOpen(false)}
            style={styles.cityModalCloseBtn}
          >
            Close
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Favorites;
