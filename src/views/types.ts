// src/types.ts

export interface FoodFormData {
    food_name: string
    expiry_days: number
    photo_path: string
}

export interface FoodItem {
    food_id: number
    food_name: string
    expiry_days: number
    photo_path: string
    remaining_days: number
    remaining_level: number
    storage_time: any
}

export interface RecognitionResult {
  food_name: string;
  expiry_days: number;
  confidence: number;
}
