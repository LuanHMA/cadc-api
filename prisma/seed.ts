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
    address: 'Rua das Flores, 120',
    district: 'Centro',
    reference_point: 'Próximo à praça',
  },
  {
    name: 'João Pereira',
    phone: '11999990002',
    address: 'Avenida Brasil, 450',
    district: 'Jardim América',
    reference_point: 'Em frente ao mercado',
  },
  {
    name: 'Ana Costa',
    phone: '11999990003',
    address: 'Rua do Comércio, 88',
    district: 'Vila Nova',
    reference_point: null,
  },
]

const PRODUCTS = [
  {
    name: 'Mesa',
    stock: MESA_STOCK,
    unit_price: '3.00',
    promocional_price: '2.00',
  },
  {
    name: 'Cadeira',
    stock: CADEIRA_STOCK,
    unit_price: '3.00',
    promocional_price: '2.00',
  },
  {
    name: 'Combo 1 mesa e 4 cadeiras',
    stock: COMBO_STOCK,
    unit_price: '10.00',
    promocional_price: null,
  },
]

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
