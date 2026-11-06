import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/database/generated/prisma/client.js'

const MESA_STOCK = 8
const CADEIRA_STOCK = 20
const COMBO_STOCK = Math.min(MESA_STOCK, Math.floor(CADEIRA_STOCK / 4))

const USER = {
  name: 'Administrador',
  email: 'admin@cadc.local',
  password: 'admin123',
}

const CUSTOMERS = [
  {
    name: 'Maria Silva',
    phone: '11999990001',
    street: 'Rua das Flores',
    house_number: '120',
    complement: 'Apto 2',
    district: 'Centro',
  },
  {
    name: 'João Pereira',
    phone: '11999990002',
    street: 'Avenida Brasil',
    house_number: '450',
    complement: null,
    district: 'Jardim América',
  },
  {
    name: 'Ana Costa',
    phone: '11999990003',
    street: 'Rua do Comércio',
    house_number: '88',
    complement: null,
    district: 'Vila Nova',
  },
]

const PRODUCTS = [
  {
    id: 'TABLE',
    name: 'Mesa',
    stock: MESA_STOCK,
    disponible_stock: MESA_STOCK,
    unit_price: '3.00',
    promocional_price: '2.00',
  },
  {
    id: 'CHAIR',
    name: 'Cadeira',
    stock: CADEIRA_STOCK,
    disponible_stock: CADEIRA_STOCK,
    unit_price: '3.00',
    promocional_price: '2.00',
  },
  {
    id: 'KIT',
    name: 'Combo 1 mesa e 4 cadeiras',
    stock: COMBO_STOCK,
    disponible_stock: COMBO_STOCK,
    unit_price: '10.00',
    promocional_price: null,
  },
] as const

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const password_hash = await bcrypt.hash(USER.password, 10)

  await prisma.user.upsert({
    where: { email: USER.email },
    update: {},
    create: {
      name: USER.name,
      email: USER.email,
      password_hash,
    },
  })

  for (const customer of CUSTOMERS) {
    const existing = await prisma.customer.findFirst({
      where: { phone: customer.phone },
    })

    if (!existing) {
      await prisma.customer.create({ data: customer })
    }
  }

  for (const product of PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    })

    if (!existing) {
      await prisma.product.create({ data: product })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
