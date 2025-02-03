// src/types.ts

export interface FoodFormData {
    name: string
    expiry_days: number
    photo_path: string
}

export interface FoodItem {
    id: number
    name: string | null
    expiry_days: number | null
    photo_path: string | null
    remaining_days: number | null
    storage_time: any | null
}