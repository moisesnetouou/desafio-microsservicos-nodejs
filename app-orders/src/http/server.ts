import { fastify } from "fastify"
import { fastifyCors } from "@fastify/cors"
import { z } from "zod"
import { randomUUID } from "node:crypto"
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod"
import { channels } from "../broker/channels/index.ts"
import { db } from "../db/client.ts"
import { schema } from "../db/schema/index.ts"

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, {
  origin: "*"
})

app.get("/health", () => {
  return 'OK'
})

app.post("/orders", {
  schema: {
    body: z.object({
      amount: z.coerce.number(),
    })
  }
}, async (request, reply) => {
  const { amount } = request.body

  console.log('Creating an order with amount', amount)

  channels.orders.sendToQueue("orders", Buffer.from("Hello World"))

  try {
    await db.insert(schema.orders).values({
      id: randomUUID(),
      customerId: '3e6f5421-c79e-41a9-b888-d4c9fb203262',
      amount
    })
  } catch (err) {
    console.log(err)
  }

  return reply.status(201).send()
})

app.listen({
  host: "0.0.0.0",
  port: 3333
}).then(() => {
  console.log("[Orders] HTTP Server running!")
})