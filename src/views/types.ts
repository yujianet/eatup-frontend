// src/types.ts

export interface FoodFormData {
    name: string
    category_large: string
    category_small: string
    expiry_days: number
    photo_path: string
}

export interface FoodItem {
    id: number
    name: string
    category_large: string
    category_small: string
    expiry_days: number
    photo_path: string
    remaining_days: number
    storage_time: any
}

export interface CategoryData {
    [largeCategory: string]: {
        [smallCategory: string]: number // 小分类名: 保质期天数
    }
}
// 示例数据结构对应：
// {
//   "蔬菜": { "叶菜": 3, "根茎": 7 },
//   "水果": { "浆果": 2, "柑橘": 5 }
// }