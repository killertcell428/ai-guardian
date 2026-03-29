"""Stripe Webhook handler for AI Guardian SaaS billing events."""
import os
import logging

import stripe
from fastapi import APIRouter, Header, HTTPException, Request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(alias="stripe-signature"),
) -> dict:
    """Handle incoming Stripe Webhook events.

    Stripe sends signed POST requests to this endpoint when billing events
    occur. The signature is verified using STRIPE_WEBHOOK_SECRET to ensure
    authenticity before processing.

    Processed events:
    - checkout.session.completed       → activate subscription in DB
    - customer.subscription.updated    → sync plan changes to DB
    - customer.subscription.deleted    → downgrade user to Free plan
    - invoice.payment_succeeded        → log successful renewal
    - invoice.payment_failed           → send warning email, start grace period
    - customer.subscription.trial_will_end → send trial-ending reminder email

    Returns:
        {"status": "ok"} on success.

    Raises:
        HTTPException 400: If signature verification fails or payload is invalid.
        HTTPException 422: If event type is unrecognized (logged and ignored).
    """
    payload = await request.body()

    # Verify Stripe signature to prevent spoofed events
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=STRIPE_WEBHOOK_SECRET,
        )
    except stripe.error.SignatureVerificationError as exc:
        logger.warning("Stripe webhook signature verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid Stripe signature") from exc
    except Exception as exc:
        logger.error("Failed to parse Stripe webhook payload: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid payload") from exc

    event_type = event["type"]
    data = event["data"]["object"]

    logger.info("Received Stripe webhook event: %s (id=%s)", event_type, event["id"])

    # ------------------------------------------------------------------
    # checkout.session.completed
    # Fired when a new subscription checkout is completed successfully.
    # ------------------------------------------------------------------
    if event_type == "checkout.session.completed":
        customer_id = data.get("customer")
        subscription_id = data.get("subscription")
        customer_email = data.get("customer_email") or data.get("customer_details", {}).get("email")

        logger.info(
            "Checkout completed: customer=%s subscription=%s email=%s",
            customer_id, subscription_id, customer_email,
        )

        # TODO: Look up user in DB by customer_email
        # TODO: Save customer_id and subscription_id to the user record
        # TODO: Fetch the plan from the subscription and update user.plan
        # TODO: Send a welcome email via Resend/SendGrid

    # ------------------------------------------------------------------
    # customer.subscription.updated
    # Fired when the user upgrades, downgrades, or resumes a subscription.
    # ------------------------------------------------------------------
    elif event_type == "customer.subscription.updated":
        customer_id = data.get("customer")
        status = data.get("status")
        price_id = (
            data.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")
        )

        logger.info(
            "Subscription updated: customer=%s status=%s price_id=%s",
            customer_id, status, price_id,
        )

        # TODO: Resolve plan name from price_id using PRICE_IDS mapping
        # TODO: Update user.plan and user.subscription_status in DB
        # TODO: If status is "past_due", flag the account and send a warning email

    # ------------------------------------------------------------------
    # customer.subscription.deleted
    # Fired when a subscription is fully canceled (end of period or immediately).
    # ------------------------------------------------------------------
    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")
        subscription_id = data.get("id")

        logger.info(
            "Subscription deleted: customer=%s subscription=%s",
            customer_id, subscription_id,
        )

        # TODO: Look up user in DB by customer_id
        # TODO: Set user.plan = "free" and user.subscription_status = "canceled"
        # TODO: Revoke API keys that exceed Free tier limits (keep only 1)
        # TODO: Send a cancellation confirmation email

    # ------------------------------------------------------------------
    # invoice.payment_succeeded
    # Fired on each successful recurring payment.
    # ------------------------------------------------------------------
    elif event_type == "invoice.payment_succeeded":
        customer_id = data.get("customer")
        amount_paid = data.get("amount_paid", 0)
        period_end = data.get("lines", {}).get("data", [{}])[0].get("period", {}).get("end")

        logger.info(
            "Payment succeeded: customer=%s amount=%d period_end=%s",
            customer_id, amount_paid, period_end,
        )

        # TODO: Update user.subscription_current_period_end in DB
        # TODO: Clear any past_due / warning flags on the account

    # ------------------------------------------------------------------
    # invoice.payment_failed
    # Fired when a renewal payment fails (e.g. expired card).
    # ------------------------------------------------------------------
    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        attempt_count = data.get("attempt_count", 1)
        next_attempt = data.get("next_payment_attempt")

        logger.warning(
            "Payment failed: customer=%s attempt=%d next_attempt=%s",
            customer_id, attempt_count, next_attempt,
        )

        # TODO: Look up user in DB by customer_id
        # TODO: Send payment failure email with Stripe Customer Portal link
        # TODO: If attempt_count >= 3, set user.plan = "free" (grace period exceeded)
        # TODO: Flag user.payment_failed = True for dashboard warning banner

    # ------------------------------------------------------------------
    # customer.subscription.trial_will_end
    # Fired 3 days before a trial period ends.
    # ------------------------------------------------------------------
    elif event_type == "customer.subscription.trial_will_end":
        customer_id = data.get("customer")
        trial_end = data.get("trial_end")

        logger.info(
            "Trial ending soon: customer=%s trial_end=%s",
            customer_id, trial_end,
        )

        # TODO: Look up user in DB by customer_id
        # TODO: Send trial-ending reminder email with CTA to add payment method
        # TODO: Include "X threats blocked during your trial" in the email body

    else:
        # Unrecognized event type — log and ignore gracefully
        logger.debug("Unhandled Stripe event type: %s", event_type)

    return {"status": "ok"}
