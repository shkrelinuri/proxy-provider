// Thin wrapper around the globally-loaded Paddle.js v2 script (see index.html).
let initialized = false;

function ensurePaddleInitialized() {
  if (initialized || !window.Paddle) return;
  window.Paddle.Environment.set(import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox');
  window.Paddle.Initialize({ token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN });
  initialized = true;
}

// Opens the Paddle overlay checkout. Resolves when the checkout is closed;
// the actual subscription activation happens async via the backend webhook.
export function openPaddleCheckout({ priceId, email, customData, onComplete }) {
  ensurePaddleInitialized();
  if (!window.Paddle) {
    throw new Error('Paddle.js failed to load. Check your network connection and ad blockers.');
  }

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: email ? { email } : undefined,
    customData,
    settings: {
      successUrl: `${window.location.origin}/billing?checkout=success`,
    },
    eventCallback: (event) => {
      if (event.name === 'checkout.completed' && onComplete) onComplete();
    },
  });
}
