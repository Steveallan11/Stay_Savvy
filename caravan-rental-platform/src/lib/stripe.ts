import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Graceful handling of missing Stripe key - don't crash the entire app
export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null)

export const isStripeEnabled = !!stripePublishableKey

// Console warning for development
if (!stripePublishableKey && import.meta.env.DEV) {
  console.warn('Stripe publishable key not found. Payment functionality will be disabled.')
}