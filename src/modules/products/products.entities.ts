export type ProductType =
    | "TABLE"
    | "CHAIR"
    | "KIT"

export interface Product {
    id: ProductType
    name: string
    stock: number
    disponible_stock: number
    unit_price: number
    promocional_price: number | null
    created_at: Date
    updated_at: Date
}