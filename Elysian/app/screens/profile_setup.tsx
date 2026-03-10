/* 
File: profile_setup.tsx
Function: This is the Profile Setup screen component for the app. Users answer questions to curate their travel profile.
*/

import { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Pressable,
  ImageBackground,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { inputTheme, styles, selectedColors } from "./app_styles.styles";
import { doc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";
import { getAuth } from "firebase/auth";
import { createPostStyles } from "./create_post.styles";

// Define the type for Home screen navigation prop
export type RootParamList = {
  ProfileSetup: undefined;
  Home: undefined;
  NavigationBar: undefined;
};

// Define the type for Home screen navigation prop
type ProfileSetUpScreenProp = NativeStackNavigationProp<
  RootParamList,
  "ProfileSetup"
>;

// Profile Setup component
const ProfileSetup = () => {
  // Initialize navigation with type safety

  // List of questions for user
  const questions = [
    {
      question: "Where are you traveling from?",
      answer: [
        "Argentina",
        "Australia",
        "Brazil",
        "Canada",
        "Chile",
        "China",
        "Colombia",
        "Croatia",
        "Cuba",
        "Czech Republic",
        "Egypt",
        "Estonia",
        "France",
        "Germany",
        "Ghana",
        "Greece",
        "Grenada",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kenya",
        "Lithuania",
        "Malaysia",
        "Mexico",
        "Morocco",
        "Netherlands",
        "New Zealand",
        "Nigeria",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Puerto Rico",
        "Qatar",
        "Russia",
        "Saudi Arabia",
        "Singapore",
        "South Africa",
        "South Korea",
        "Spain",
        "Switzerland",
        "Tanzania",
        "Thailand",
        "Turkey",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "United States (Hawaii)",
        "Uruguay",
        "Vietnam",
      ],
    },
    {
      question: "What type(s) of vacation are you looking for?",
      answer: [
        "Beach",
        "City",
        "Historical",
        "Adventure",
        "Nature",
        "Religious",
      ],
    },
    {
      question: "What season(s) do you like?",
      answer: ["Spring", "Summer", "Fall", "Winter"],
    },
    {
      question: "What is your budget(s)?",
      answer: ["Budget Friendly", "Mid-Range", "Luxury", "Premium"],
    },
    {
      question: "Of countries visited, which has been your favorite?",
      answer: [
        "Argentina",
        "Australia",
        "Brazil",
        "Canada",
        "Chile",
        "China",
        "Colombia",
        "Croatia",
        "Cuba",
        "Czech Republic",
        "Egypt",
        "Estonia",
        "France",
        "Germany",
        "Ghana",
        "Greece",
        "Grenada",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kenya",
        "Lithuania",
        "Malaysia",
        "Mexico",
        "Morocco",
        "Netherlands",
        "New Zealand",
        "Nigeria",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Puerto Rico",
        "Qatar",
        "Russia",
        "Saudi Arabia",
        "Singapore",
        "South Africa",
        "South Korea",
        "Spain",
        "Switzerland",
        "Tanzania",
        "Thailand",
        "Turkey",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "United States (Hawaii)",
        "Uruguay",
        "Vietnam",
        "nan",
      ],
    },
    {
      question: "What type of place(s) do you like?",
      answer: ["Quiet", "Moderate", "Busy"],
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Stores the index of the current question
  const [chosenAnswers, setChosenAnswers] = useState<{
    [key: number]: string[];
  }>({}); // Stores the choosen answer for each multi-select questions
  const [typedAnswer, setTypedAnswer] = useState(""); // Stores the typed answer for the drop down.
  const [responses, setResponses] = useState<{
    [key: number]: string[] | string;
  }>({}); // Stores all the responses the user has made (dropdown + multiple choice)
  const [dropdownOpen, setDropdownOpen] = useState(false); // Stores whether to open the drop down if the user has typed or not.

  const currentQuestion = questions[currentQuestionIndex]; // Sets the current question based on current inde
  // const isShortAnswer = currentQuestion.answer.length === 0; // If there is no answers to display, it is a short answer question; otherwise, it's multi-select
  const isAutocomplete =
    currentQuestion.answer.length > 0 &&
    (currentQuestionIndex === 0 || currentQuestionIndex === 4); // These are the questions that have a drop down.

  // Count how many previous questions have answer buttons
  const buttonQuestionIndex = questions
    .slice(0, currentQuestionIndex)
    .filter((q) => q.answer.length > 0).length;

  // Pick color from the 4-color cycle
  const currentSelectedColor =
    selectedColors[buttonQuestionIndex % selectedColors.length];

  // Handles user selection for mutli-select questions
  const answerSelected = (answer: string) => {
    const currentAnswers = chosenAnswers[currentQuestionIndex] || []; // Get the current list of answers if any are selected; otherwise, current list is empty
    // If the user is clicking on an answer already selected, then unselect it.
    if (currentAnswers.includes(answer)) {
      setChosenAnswers({
        ...chosenAnswers,
        [currentQuestionIndex]: currentAnswers.filter((a) => a !== answer), // Update the current answer to remove the unselected answer
      });
    }

    // Otherwise, the user wants to select this answer, so add it to the selection
    else {
      setChosenAnswers({
        ...chosenAnswers,
        [currentQuestionIndex]: [...currentAnswers, answer],
      });
    }
  };

  // Handles submission of answers and stores it in Firebase
  const handleSubmit = async (finalResponses: {
    [key: number]: string[] | string;
  }) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Error, User must be signed in!");
      return;
    }

    try {
      const userDocRef = doc(FIREBASE_DB, "userProfiles", user.uid);
      await setDoc(userDocRef, { responses: finalResponses }, { merge: true });
    } catch (error) {
      console.error("Encountered an error while saving your answer:", error);
      alert("Error, There was an error while saving your answers.");
    }
  };

  // Handles action when next button is selected
  const nextQuestion = () => {
    // Check that there is an answer typed for short answer questions
    if (isAutocomplete && typedAnswer.trim() === "") {
      alert("Answer required. Please select from dropdown.");
      return;
    }

    // Check that there is an answer selected for multi-select questions
    if (
      !isAutocomplete &&
      (!chosenAnswers[currentQuestionIndex] ||
        chosenAnswers[currentQuestionIndex].length === 0)
    ) {
      alert("Answer required. Please select an answer.");
      return;
    }

    // Now, save the reponse of the user for the current question before going to the next question
    setResponses((current) => ({
      ...current,
      [currentQuestionIndex]: isAutocomplete
        ? typedAnswer
        : chosenAnswers[currentQuestionIndex],
    }));

    // Go to the next question after saving the response of the current question
    // Ensure that this is not the final question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((current) => current + 1); // Set the current question index to the next index
      setTypedAnswer(""); // Reset the typed answer to empty so that the user can type in new answers
    }

    // Otherwise, the user has answered all questions
    // Navigate to home page
    else {
      const finalResponses = {
        ...responses,
        [currentQuestionIndex]: isAutocomplete
          ? typedAnswer
          : chosenAnswers[currentQuestionIndex],
      };
      handleSubmit(finalResponses);
      console.log("All User Responses: ", responses); // Print response

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("Error, User must be signed in!");
        return;
      }

      setDoc(
        doc(FIREBASE_DB, "users", user.uid),
        { accountCreationComplete: true },
        { merge: true },
      );
    }
  };

  return (
    // accessible={false} prevents screen readers from treating this as a button
    <ImageBackground
      source={require("../../assets/login_page_background.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setDropdownOpen(false);
        }}
        style={{ flex: 1 }}
        accessible={false}
      >
        <View style={styles.container}>
          {/* Display the question. */}
          <Text variant="headlineLarge" style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          {/* If the question is a short answer question, display like this: */}
          {isAutocomplete ? (
            <View style={{ width: "100%", position: "relative" }}>
              <TextInput
                label="Country"
                value={typedAnswer}
                onChangeText={(text) => {
                  setTypedAnswer(text);
                  setDropdownOpen(true);
                }}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
              />

              {dropdownOpen && typedAnswer.length > 0 && (
                <View style={styles.profileSetupDropdown}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {(() => {
                      const filtered = currentQuestion.answer.filter(
                        (country) =>
                          country
                            .toLowerCase()
                            .includes(typedAnswer.toLowerCase()),
                      );

                      if (filtered.length === 0) {
                        return (
                          <View style={createPostStyles.dropdownItem}>
                            <Text style={styles.searchResultNoneText}>
                              No Results
                            </Text>
                          </View>
                        );
                      }

                      return filtered.map((country, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setTypedAnswer(country);
                            setDropdownOpen(false);
                          }}
                          style={createPostStyles.dropdownItem}
                        >
                          <Text variant="bodyLarge">{country}</Text>
                        </TouchableOpacity>
                      ));
                    })()}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {currentQuestion.answer.map((answer, index) => {
                const selected =
                  chosenAnswers[currentQuestionIndex]?.includes(answer);

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => answerSelected(answer)}
                    activeOpacity={0.8}
                    style={[
                      styles.answerButton,
                      selected && { backgroundColor: currentSelectedColor },
                    ]}
                  >
                    <Text
                      variant="bodyLarge"
                      style={[
                        styles.answerText,
                        { color: currentSelectedColor },
                        selected && styles.answerTextSelected,
                      ]}
                    >
                      {answer}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Next or Finish button */}
          <Button
            mode="contained"
            onPress={nextQuestion}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
          </Button>
        </View>
      </Pressable>
    </ImageBackground>
  );
};

export default ProfileSetup;
