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

export type OrderItemType =
    | "TABLE"
    | "CHAIR"
    | "KIT_TABLE_CHAIR"

export interface OrderItem {
    id: string
    order_id: string
    type: OrderItemType
    quantity: number
    unit_price: number
    subtotal: number
    created_at: Date
    updated_at: Date
}