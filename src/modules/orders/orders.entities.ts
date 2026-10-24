import { ProductType } from "../products/products.entities.js"

export type OrderType = 
    | "PENDING_DELIVERY" 
    | "DELIVERED" 
    | "PENDING_PICKUP" 
    | "COMPLETED" 
    | "CANCELLED"


export type OrderPaymentMethod =
    | "CASH"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "PIX"
    | "OTHER"

export interface Order {
    id: string
    customer_id: string
    delivery_date: Date
    pickup_date: Date
    status: OrderType
    payment_method: OrderPaymentMethod
    total_price: number
    observations?: string
    created_at: Date
    updated_at: Date
}

export interface OrderItem {
    id: string
    order_id: string
    product_id: ProductType
    quantity: number
    unit_price: number
    subtotal: number
    created_at: Date
    updated_at: Date
}