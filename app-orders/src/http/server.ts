import "@opentelemetry/auto-instrumentations-node/register"

import { fastify } from "fastify"

import { fastifyCors } from "@fastify/cors"
import { z } from "zod"
import { randomUUID } from "node:crypto"
import { setTimeout } from "node:timers/promises"
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod"
import { db } from "../db/client.ts"
import { schema } from "../db/schema/index.ts"
import { dispatchOrderCreated } from "../broker/messages/order-created.ts"
import { trace } from "@opentelemetry/api"
import { tracer } from "../tracer/tracer.ts"

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

  const orderId = randomUUID()

  try {
    await db.insert(schema.orders).values({
      id: randomUUID(),
      customerId: '3e6f5421-c79e-41a9-b888-d4c9fb203262',
      amount
    })
  } catch (err) {
    console.log(err)
  }

  trace.getActiveSpan()?.setAttribute('order_id', orderId)

  const span = tracer.startSpan("Eu acho que aqui está dando problema.")
  
  span.setAttribute("teste", "Hello World")

  await setTimeout(2000)

  span.end()

  dispatchOrderCreated({
    orderId,
    amount,
    customer: {
      id: '3e6f5421-c79e-41a9-b888-d4c9fb203262'
    }
  })

  return reply.status(201).send()
})

app.listen({
  host: "0.0.0.0",
  port: 3333
}).then(() => {
  console.log("[Orders] HTTP Server running!")
})