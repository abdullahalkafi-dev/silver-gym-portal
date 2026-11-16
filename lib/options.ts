// Same choices as the dashboard member form, so staff always receive consistent values.

export const GENDERS = ["Male", "Female", "Other"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const COUNTRIES = ["Bangladesh", "India", "Pakistan", "Nepal", "Other"] as const;
export const RELATIONSHIPS = ["Father", "Mother", "Brother", "Sister", "Spouse", "Friend", "Other"] as const;
export const HEIGHT_UNITS = ["cm", "in", "ft"] as const;
export const WEIGHT_UNITS = ["kg", "lb"] as const;

export const TRAINING_GOALS = [
  "Yoga",
  "Cardio Endurance",
  "Bodybuilding",
  "Muscle Gain",
  "Flexibility & Mobility",
  "General Fitness",
  "Strength Training",
] as const;
