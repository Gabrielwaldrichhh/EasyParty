const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não definida no .env');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
