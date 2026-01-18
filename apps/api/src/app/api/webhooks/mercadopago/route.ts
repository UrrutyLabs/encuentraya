import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { getPaymentProviderClient } from "@/server/modules/payment/registry";
import { PaymentProvider } from "@repo/domain";
import { createChildLogger } from "@/server/infrastructure/utils/logger";
import { randomUUID } from "crypto";
import type { PaymentServiceFactory } from "@/server/container";
import { container, TOKENS } from "@/server/container";
import { getWebhookCorsHeaders } from "@/server/infrastructure/cors";

/**
 * Mercado Pago webhook endpoint
 * Handles payment status updates from Mercado Pago
 * 
 * Idempotency: Events are stored in PaymentEvent table, allowing safe replay
 * 
 * Flow:
 * 1. Parse webhook payload using MercadoPagoClient.parseWebhook
 * 2. Pass event to PaymentService.handleProviderWebhook
 * 3. PaymentService updates Payment and Booking status safely
 * 4. Return 200 quickly (async processing)
 * 
 * Example curl (for testing with real MP payload):
 * ```bash
 * curl -X POST http://localhost:3002/api/webhooks/mercadopago \
 *   -H "Content-Type: application/json" \
 *   -H "x-signature: <mp-signature>" \
 *   -H "x-request-id: <mp-request-id>" \
 *   -d '{
 *     "action": "payment.updated",
 *     "api_version": "v1",
 *     "data": {
 *       "id": "123456789"
 *     },
 *     "date_created": "2024-01-11T12:00:00Z",
 *     "id": 123456,
 *     "live_mode": false,
 *     "type": "payment",
 *     "user_id": "123456"
 *   }'
 * ```
 */
export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const logger = createChildLogger({
    requestId,
    endpoint: "webhook.mercadopago",
  });

  try {
    // Get raw body for webhook verification
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Create a new Request object with the raw body for the provider client
    // Note: We need to reconstruct the request since Next.js consumes the body
    const webhookRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody,
    });

    // Get Mercado Pago provider client
    const providerClient = await getPaymentProviderClient(PaymentProvider.MERCADO_PAGO);

    // Parse webhook payload
    const event = await providerClient.parseWebhook(webhookRequest);

    if (!event) {
      logger.warn({ headers, bodyLength: rawBody.length }, "Invalid or unrecognized webhook payload");
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    logger.info(
      {
        provider: event.provider,
        providerReference: event.providerReference,
        eventType: event.eventType,
      },
      "Processing webhook event"
    );

    // Create payment service using DI container
    const paymentServiceFactory = container.resolve<PaymentServiceFactory>(
      TOKENS.PaymentServiceFactory
    );
    const paymentService = await paymentServiceFactory(event.provider);

    // Handle webhook asynchronously to return quickly
    // PaymentService.handleProviderWebhook is idempotent via PaymentEvent storage
    paymentService
      .handleProviderWebhook(event)
      .then(() => {
        logger.info(
          {
            providerReference: event.providerReference,
            eventType: event.eventType,
          },
          "Webhook processed successfully"
        );
      })
      .catch((error: unknown) => {
        logger.error(
          {
            providerReference: event.providerReference,
            eventType: event.eventType,
            error: {
              name: error instanceof Error ? error.name : "Unknown",
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
          },
          "Error processing webhook"
        );
      });

    // Return 200 immediately (webhook processing is async)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error(
      {
        error: {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      "Error handling webhook"
    );

    // Return 200 even on error to prevent MP from retrying
    // Errors are logged and can be handled manually
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 200 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = getWebhookCorsHeaders(requestOrigin);
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
