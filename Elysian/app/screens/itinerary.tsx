import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, TouchableOpacity, Alert, Image} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { GlassView } from "expo-glass-effect";
import { itineraryStyles } from "./itinerary.styles";
import { styles } from "./app_styles.styles";
import type { FavoritesStackParamList } from "./navigation_bar";

import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";
import PenguinLoader from "./penguin_loader";

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
  const [previousCity, setPreviousCity] = useState<FavCity | null>(null);

  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [activityOptions, setActivityOptions] = useState<
    { name: string; category: string }[]
  >([]);

  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [selectedCity, setSelectedCity] = useState<FavCity | null>(null);
  const isItineraryListMode = !!selectedCity;

  const [selectedFilters, setSelectedFilters] = useState<ActivityCategory[]>([]);

  // Reset search UI when leaving screen
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
    closeSearch();

    // Switch to itinerary list mode
    setSelectedCity(city);
    getActivities(city);

  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setDropdownOpen(false);
    setSelectedCity(previousCity);  // Restore previous page
  }

  const handleBack = () => {
    // In itinerary list mode, go back to city-search within this page
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
      const res = await fetch(`http://100.70.30.211:5003/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.name,
          country: city.country,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch activities.");
      const json = await res.json();
      setActivityOptions(json.activities);
    } catch (err: any) {
      setActivitiesError(err.message);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const saveItinerary = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      if (!selectedCity) {
        Alert.alert("No city selected", "Pick a city first.");
        return;
      }
      const itineraryRef = collection(FIREBASE_DB, "userItineraries", user.uid, "savedItineraries");
      await addDoc(itineraryRef, {
        city: selectedCity.name,
        country: selectedCity.country,
        activities: selectedActivities,
        updatedAt: new Date(),
      });


      console.log("Itinerary saved successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Error saving itinerary:", err);
    }

  };


  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Overlay title: Create Itinerary */}
      {!searchOpen && !isItineraryListMode && (
        <View style={itineraryStyles.container} pointerEvents="none">
          <Text style={itineraryStyles.itineraryTitle}>Create{"\n"}Itinerary</Text>
          <Text style={itineraryStyles.itineraryDescription}>
            Search your favorite cities, discover activities, and build your perfect itinerary. Save it to your profile to share and co-plan trips with friends!
          </Text>
          <Image
            source={require("../../assets/penguin.png")}
            style={itineraryStyles.bottomImage}
            resizeMode="contain"
          />
        </View>
      )}

      {!searchOpen && (
        <View style={styles.topLeftIcon}>
          <Pressable onPress={handleBack}>
            <GlassView style={styles.glassButton}>
              <Ionicons name="chevron-back" size={26} color="#000" />
            </GlassView>
          </Pressable>
        </View>
      )}

      {/* Search overlay */}
      <View style={styles.searchOverlay}>
        <TouchableOpacity
          style={styles.topRightIcon}
          onPress={() => {
            if (!searchOpen) {
              setPreviousCity(selectedCity); // Remember current page
              setSearchOpen(true);
            } else {
              closeSearch();
            }
          }}
        >
          <GlassView style={styles.glassButton}>
            <Ionicons name="search" size={26} color="#000" />
          </GlassView>
        </TouchableOpacity>

        {searchOpen && (
          <GlassView style={styles.searchBarExpanded}>
            <TextInput
              placeholder="Search favorited cities..."
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

      {/* Tap outside to close search */}
      {searchOpen && (
        <Pressable
          style={styles.searchBackdrop}
          onPress={closeSearch}
        />
      )}

      {/* Dropdown results */}
      {searchOpen && dropdownOpen && searchQuery.trim().length > 0 &&(
        <GlassView style={styles.searchDropdown}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {loading ? (
              <View style={styles.searchResultItem}>
                <Text>Loading...</Text>
              </View>
            ) : error ? (
              <View style={styles.searchResultItem}>
                <Text>{error}</Text>
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
                <Text>No Results</Text>
              </View>
            )}
          </ScrollView>
        </GlassView>
      )}

      {/* Display activites after selecting a city */}
      {!searchOpen && selectedCity && (
        <>
          {/* ===== Loader & error messages overlay ===== */}
          {activitiesLoading ? (
            <PenguinLoader text="Loading activities..." />
          ) : activitiesError ? (
            <PenguinLoader text={activitiesError} />
          ) : activityOptions.length === 0 ? (
            <PenguinLoader text="No activities found." />
          ) : null}

          <View style={itineraryStyles.pageContainer}>
            {/* City header row */}
            <View style={itineraryStyles.itineraryCityHeaderRow}>
              <Text style={itineraryStyles.itineraryCityName}>
                {selectedCity.name}
              </Text>
              <Text style={itineraryStyles.itineraryCountryName}>
                {selectedCity.country}
              </Text>
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
                contentContainerStyle={{ paddingBottom: 200 }}
              >
                {!activitiesLoading && !activitiesError && activityOptions.length > 0 &&(
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

                {/* Save button */}
                {selectedCity && selectedActivities.length > 0 && (
                  <Button
                    mode="contained"
                    onPress={saveItinerary}
                    style={[styles.button, { marginTop: 35 }]}
                    labelStyle={styles.buttonLabel}
                  >
                    Save
                  </Button>
                )}
              </ScrollView>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default Itinerary;