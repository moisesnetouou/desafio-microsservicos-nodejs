import { trace } from "@opentelemetry/api"
import { th } from "zod/v4/locales"

if (!process.env.OTEL_SERVICE_NAME) {
  throw new Error('OTEL_SERVICE_NAME must be configured.')
}

export const tracer = trace.getTracer(process.env.OTEL_SERVICE_NAME)