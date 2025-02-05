// src/types.ts

export interface FoodFormData {
    food_name: string
    expiry_days: number
    photo_path: string
}

export interface FoodItem {
    food_id: number
    food_name: string | null
    expiry_days: number | null
    photo_path: string | null
    remaining_days: number | null
    storage_time: any | null
}

export interface RecognitionResult {
  food_name: string;
  expiry_days: number;
  confidence: number;
}
