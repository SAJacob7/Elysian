import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GlassView } from "expo-glass-effect";
import { itineraryStyles } from "./itinerary.styles";
import { styles } from "./app_styles.styles";
import type { FavoritesStackParamList } from "./navigation_bar";

import { getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";

type FavCity = {
  id: string;
  name: string;
  country: string;
};
type ActivityCategory = "restaurants" | "outdoor" | "arts" | "entertainment";

type Activity = {
  name: string;
  category: ActivityCategory;
};

const FILTER_OPTIONS: { label: string; value: ActivityCategory }[] = [
  { label: "Restaurant", value: "restaurants" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Arts", value: "arts" },
  { label: "Entertainment", value: "entertainment" },
];

type ItineraryRouteProp = RouteProp<FavoritesStackParamList, "Itinerary">;

const Itinerary = () => {
  const navigation = useNavigation();
  const route = useRoute<ItineraryRouteProp>();

  const [favoritesCities, setFavoritesCities] = useState<FavCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Favorites-style search UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);  // This is to filter the categories selected.
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [activityOptions, setActivityOptions] = useState<
    { name: string; category: string }[]
  >([]);

  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Selected city -> shows builder header
  const [selectedCity, setSelectedCity] = useState<FavCity | null>(null);
  const isBuilderMode = !!selectedCity;

  const [selectedFilters, setSelectedFilters] = useState<ActivityCategory[]>([]);

  // Reset search UI when leaving screen (matches Favorites behavior)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchOpen(false);
        setSearchQuery("");
        setDropdownOpen(false);
      };
    }, [])
  );

  // Load favorited cities (userFavorites) in realtime
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("No user signed in.");
      setFavoritesCities([]);
      return;
    }

    setLoading(true);
    setError(null);

    const favoritesRef = doc(FIREBASE_DB, "userFavorites", user.uid);

    const unsubscribe = onSnapshot(
      favoritesRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setFavoritesCities([]);
            setError(null);
            return;
          }

          const data = snapshot.data() || {};
          const favs: FavCity[] = Object.keys(data)
            .map((key) => ({
              id: key,
              name: data[key]?.city_name ?? "",
              country: data[key]?.country_name ?? "",
            }))
            .filter((c) => c.name && c.country);

          setFavoritesCities(favs);
          setError(null);
        } catch (e) {
          console.error("Error parsing favorites:", e);
          setError("Failed to load favorite cities.");
          setFavoritesCities([]);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setError("Failed to load favorite cities.");
        setFavoritesCities([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredFavorites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return favoritesCities.filter((c) =>
      `${c.name}, ${c.country}`.toLowerCase().includes(q)
    );
  }, [favoritesCities, searchQuery]);

  const handleSelectCity = (city: FavCity) => {
    // close search UI first
    setSearchOpen(false);
    setSearchQuery("");
    setDropdownOpen(false);

    // switch into builder mode
    setSelectedCity(city);
    getActivities(city);

  };

  const handleBack = () => {
    // In builder mode, go back to city-search within this page
    if (selectedCity) {
      setSelectedCity(null);
      return;
    }
    navigation.goBack();
  };

  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

  // Reset search UI when leaving screen (matches Favorites behavior)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchOpen(false);
        setSearchQuery("");
        setDropdownOpen(false);
      };
    }, [])
  );

  const visibleActivities = useMemo(() => {
    if (selectedFilters.length === 0) return activityOptions; // no filters = show all
    return activityOptions.filter(a => selectedFilters.includes(a.category as ActivityCategory));
  }, [activityOptions, selectedFilters]);



  const getActivities = async (city: FavCity) => {
    setActivitiesLoading(true);
    setActivitiesError(null);

    try {
      const res = await fetch(`https://capstone-team-generated-group30-project.onrender.com/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.name,
          country: city.country,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch activities");

      const json = await res.json();
      console.log("activities status:", res.status);
      console.log(json);
      setActivityOptions(json.activities);
    } catch (err: any) {
      setActivitiesError(err.message);
    } finally {
      setActivitiesLoading(false);
    }
    console.log(activityOptions);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ===== Overlay back icon (ONLY in search mode, not builder) ===== */}
      {!searchOpen && !isBuilderMode && (
        <View style={styles.topLeftIcon}>
          <Pressable onPress={handleBack}>
            <GlassView style={styles.glassButton}>
              <Ionicons name="chevron-back" size={26} color="#000" />
            </GlassView>
          </Pressable>
        </View>
      )}

      {/* Overlay Title (ONLY in search mode, not builder) */}
      {!searchOpen && !isBuilderMode && (
        <View style={itineraryStyles.itineraryTitleWrapper} pointerEvents="none">
          <Text style={itineraryStyles.itineraryTitle}>Create{"\n"}Itinerary</Text>
        </View>
      )}

      {/* Search Overlay (ONLY when not in builder) */}
      {!isBuilderMode && (
        <View style={styles.searchOverlay}>
          <TouchableOpacity
            style={styles.topRightIcon}
            onPress={() => setSearchOpen((prev) => !prev)}
          >
            <GlassView style={styles.glassButton}>
              <Ionicons name="search" size={26} color="#000" />
            </GlassView>
          </TouchableOpacity>

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
                cursorColor="#000"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </GlassView>
          )}
        </View>
      )}

      {/* Tap outside to close search */}
      {searchOpen && !isBuilderMode && (
        <Pressable
          style={styles.searchBackdrop}
          onPress={() => {
            setSearchOpen(false);
            setSearchQuery("");
            setDropdownOpen(false);
          }}
        />
      )}

      {/* Dropdown Results (ONLY from userFavorites) */}
      {searchOpen &&
        dropdownOpen &&
        searchQuery.trim().length > 0 &&
        !isBuilderMode && (
          <GlassView style={styles.searchDropdown}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {loading ? (
                <View style={styles.searchResultItem}>
                  <Text style={{ color: "#888" }}>Loading...</Text>
                </View>
              ) : error ? (
                <View style={styles.searchResultItem}>
                  <Text style={{ color: "#888" }}>{error}</Text>
                </View>
              ) : filteredFavorites.length > 0 ? (
                filteredFavorites.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectCity(city)}
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

      {/* Display activites after selecting a city */}
      {selectedCity && (
        <View style={itineraryStyles.itineraryBuilderWrapper}>
          {/* City header row */}
          <View style={itineraryStyles.itineraryCityHeaderRow}>
            <Pressable onPress={handleBack}>
              <GlassView style={styles.glassButton}>
                <Ionicons name="chevron-back" size={26} color="#000" />
              </GlassView>
            </Pressable>

            <View style={itineraryStyles.itineraryCityTitleWrap}>
              <Text style={itineraryStyles.itineraryCityName}>{selectedCity.name}</Text>
              <Text style={itineraryStyles.itineraryCountryName}>
                {selectedCity.country}
              </Text>
            </View>

            {/* Search icon in builder: returns you to search mode */}
            <Pressable
              onPress={() => {
                setSelectedCity(null);
                setSearchOpen(true);
              }}
            >
              <GlassView style={styles.glassButton}>
                <Ionicons name="search" size={26} color="#000" />
              </GlassView>
            </Pressable>
          </View>

          {/* Category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={itineraryStyles.itineraryPillsRow}
            contentContainerStyle={itineraryStyles.itineraryPillsContent}
          >
            {FILTER_OPTIONS.map((f) => {
              const selected = selectedFilters.includes(f.value);

              return (
                <TouchableOpacity
                  key={f.value}
                  onPress={() =>
                    setSelectedFilters(
                      (prev) =>
                        toggleInArray(prev, f.value) as ActivityCategory[]
                    )
                  }
                  style={[
                    itineraryStyles.itineraryPill,
                    selected && itineraryStyles.itineraryPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      itineraryStyles.itineraryPillText,
                      selected && itineraryStyles.itineraryPillTextSelected,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[itineraryStyles.itineraryActivitiesWrap, { flex: 1 }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 140 }}
            >
              {activitiesLoading ? (
                <Text style={{ color: "#888", padding: 12 }}>Loading activities...</Text>
              ) : activitiesError ? (
                <Text style={{ color: "#888", padding: 12 }}>{activitiesError}</Text>
              ) : activityOptions.length === 0 ? (
                <Text style={{ color: "#888", padding: 12 }}>No activities found.</Text>
              ) : (
                visibleActivities.map((a) => {
                  const checked = selectedActivities.includes(a.name);
                  return (
                    <TouchableOpacity
                      key={a.name}
                      onPress={() =>
                        setSelectedActivities((prev) => toggleInArray(prev, a.name))
                      }
                      style={itineraryStyles.itineraryActivityRow}
                    >
                      <View
                        style={[
                          itineraryStyles.itineraryCheckbox,
                          checked && itineraryStyles.itineraryCheckboxChecked,
                        ]}
                      />
                      <Text style={itineraryStyles.itineraryActivityText}>
                        {a.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })

              )}
            </ScrollView>

            {/* Save button */}
            {/* <TouchableOpacity
              onPress={handleSaveItinerary}
              style={styles.button}
            >
              <Text style={styles.buttonLabel}>Save Itinerary</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Itinerary;