/* 
File: navigation_bar.tsx
Function: This is the Navigation Bar component for the Home and Profile screen. 
*/

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";

import { styles } from "./app_styles.styles";
import Icon from "react-native-vector-icons/Ionicons";
import Home from "./home";
import Recommendations from "./recommendations";
import Favorites from "./favorites";
import Profile from "./profile";
import Itinerary from "./itinerary";
import ProfilePreferences from "./profile_preferences";
import CreatePost from "./create_post";

export type FavoritesStackParamList = {
  FavoritesMain: undefined;
  Itinerary: undefined;
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfilePreferences: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  CreatePost: { imageURIs: string[] };
}

// Define the navigation parameter list
export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Recommendations: undefined;
  Favorites: NavigatorScreenParams<FavoritesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Define the type for Navigation bar screen navigation prop
const Tab = createBottomTabNavigator<RootTabParamList>();

const FavoritesStack = createNativeStackNavigator();
const ProfilesStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

function FavoritesStackScreen() {
  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen
        name="FavoritesMain"
        component={Favorites}
        options={{ headerShown: false }}
      />
      <FavoritesStack.Screen
        name="Itinerary"
        component={Itinerary}
        options={{ headerShown: false }}
      />
    </FavoritesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfilesStack.Navigator>
      <ProfilesStack.Screen
        name="ProfileMain"
        component={Profile}
        options={{ headerShown: false }}
      />
      <ProfilesStack.Screen
        name="ProfilePreferences"
        component={ProfilePreferences}
        options={{ headerShown: false }}
      />
    </ProfilesStack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={Home}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="CreatePost"
        component={CreatePost}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

export default function NavigationBar() {
  // Dictionary to map page screens to icon names from Ionicons. https://ionic.io/ionicons
  const icons: { [key: string]: string } = {
    Home: "home-outline",
    Recommendations: "airplane-outline",
    Favorites: "bookmark-outline",
    Profile: "person-circle-outline",
  };

  return (
    // Create the navigation bar
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Icon
            name={icons[route.name]}
            size={30}
            color={focused ? "#FFFFFF" : "#807f7fff"}
          />
        ),

        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.navBar,
        tabBarItemStyle: styles.navBarIcons,
        tabBarBackground: () => null,
      })}
    >
      {/* Define individual tab pages */}
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            navigation.navigate("Home", {
              screen: "HomeMain",
            });
          },
        })}
      />

      <Tab.Screen name="Recommendations" component={Recommendations} />

      <Tab.Screen
        name="Favorites"
        component={FavoritesStackScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            navigation.navigate("Favorites", {
              screen: "FavoritesMain",
            });
          },
        })}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            navigation.navigate("Profile", {
              screen: "ProfileMain",
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}
