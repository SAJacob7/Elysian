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
      if (!user) return;

      const userFavoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);

      // 1) Save basic info immediately
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

      // 2) Fetch image + description in background
      const [image, description] = await Promise.all([
        fetchUnsplashImage(city.name, city.country),
        fetchCityInfo(city.name, city.country),
      ]);

      const patch: any = {};
      if (image) patch.image = image;
      if (description) patch.description = description;

      // 3️) Save extras if they exist
      if (Object.keys(patch).length > 0) {
        await setDoc(
          userFavoritesRef,
          {
            [city.id]: patch,
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Error adding to favorites:", err);
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
  const fetchWikivoyageIntro = async (
    cityName: string,
    country: string
  ): Promise<string | null> => {
    const titlesToTry = [
      cityName,
      `${cityName}, ${country}`,
      `${cityName} (${country})`,
    ];

    for (const title of titlesToTry) {
      try {
        const url =
          `https://en.wikivoyage.org/w/api.php` +
          `?action=query&format=json&origin=*` +
          `&prop=extracts&exintro=1&explaintext=1&redirects=1` +
          `&titles=${encodeURIComponent(title)}`;

        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        const pages = data?.query?.pages;
        if (!pages) continue;

        const page = pages[Object.keys(pages)[0]];
        const extract = page?.extract;

        if (
          extract &&
          !extract.toLowerCase().includes("more than one place") &&
          !extract.toLowerCase().includes("may refer to")
        ) {
          return extract;
        }
      } catch {
        continue;
      }
    }

    return null;
  };

  const makeTravelBlurb = (raw: string) => {
    const cleaned = raw
      .replace(/\s+/g, " ")
      .replace(/\[[^\]]*\]/g, "")
      .trim();

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);

    const good = sentences
      .filter((s) => s.length >= 60 && s.length <= 160)
      .slice(0, 2)
      .join(" ");

    const fallback = sentences.slice(0, 1).join(" ");

    let out = (good || fallback || "").trim();

    const MAX = 520; // cap
    if (out.length > MAX) {
      let cut = out.slice(0, MAX).trimEnd();

      // try to end at punctuation so it doesn't look chopped
      const lastPunct = Math.max(
        cut.lastIndexOf("."),
        cut.lastIndexOf("!"),
        cut.lastIndexOf("?")
      );

      if (lastPunct > 80) {
        cut = cut.slice(0, lastPunct + 1);
      } else {
        // fallback: cut at a word boundary, but don't add "..."
        cut = cut.replace(/\s+\S*$/, "").trimEnd();
        if (!cut.endsWith(".")) cut += ".";
      }

      out = cut;
    }
    return out || "No description available.";
  };

  const fetchCityInfo = async (cityName: string, country: string) => {
    try {
      const raw = await fetchWikivoyageIntro(cityName, country);
      if (!raw) return undefined;
      return makeTravelBlurb(raw);
    } catch {
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

              // --- IMAGE (Unsplash only) ---
              let image = city.image;
              if (!image) {
                image = await fetchUnsplashImage(
                  city.city_name,
                  city.country_name
                );

                // Persist if we got one
                if (image) {
                  await updateDoc(favoritesRef, {
                    [`${key}.image`]: image,
                  });
                }
              }

              // --- DESCRIPTION (Wikivoyage only, travel blurb) ---
              //let description = city.description;

              // if old descriptions exist, they block the new pipeline
              // const looksOld =
              //   typeof description === "string" &&
              //   (description.length > 260 || // usually too long
              //     description.includes("population") ||
              //     description.includes("Founded in") ||
              //     description.includes("capital of"));

              // // fetch if missing OR looks old
              // if (!description || looksOld) {
              //   const fresh = await fetchCityDescription(
              //     city.city_name,
              //     city.country_name
              //   );
              // const description = city.description;
              //   if (fresh) {
              //     description = fresh;
              //     await updateDoc(favoritesRef, {
              //       [`${key}.description`]: fresh,
              //     });
              //   }
              // }

              const description = city.description;

              return {
                city_id: key,
                city_name: city.city_name,
                country: city.country_name,
                image: image || undefined,
                description: description || undefined,
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

          {loading && <PenguinLoader text="Loading your favorite cities!" />}
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
