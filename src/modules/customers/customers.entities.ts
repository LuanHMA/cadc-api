export interface Customer {
    id: string
    name: string
    phone: string
    street: string
    house_number: string
    complement: string | null
    district: string
    created_at: Date
    updated_at: Date
}

export interface CustomerDetails extends Customer {
    active_orders: number
    completed_orders: number
    total_spent: number
}