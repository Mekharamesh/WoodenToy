/**
 * Cashfree Payment Gateway Service
 * ---------------------------------
 * Uses cashfree-pg v6.0.4. Credentials are loaded from backend/.env.
 */

const https = require('https');
const { Cashfree, CFEnvironment } = require('cashfree-pg');

const getCashfreeApiVersion = () => process.env.CASHFREE_API_VERSION || '2023-08-01';

const getCashfreeEnvironmentName = () =>
  (process.env.CASHFREE_ENV || process.env.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase();

const getCashfreeCredentials = () => {
  const clientId = (process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID || '').trim();
  const clientSecret = (process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY || '').trim();

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are missing. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in backend/.env.');
  }

  return { clientId, clientSecret };
};

const getCashfreeEnvironment = () =>
  getCashfreeEnvironmentName() === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

const allowInsecureTls = () =>
  getCashfreeEnvironmentName() !== 'production' && process.env.CASHFREE_ALLOW_INSECURE_TLS === 'true';

const createAxiosInstance = () => {
  if (!allowInsecureTls()) return undefined;

  const axios = require('axios');
  return axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });
};

const createClient = () => {
  const { clientId, clientSecret } = getCashfreeCredentials();
  const cashfree = new Cashfree(
    getCashfreeEnvironment(),
    clientId,
    clientSecret,
    undefined,
    undefined,
    undefined,
    false,
    createAxiosInstance()
  );
  cashfree.XApiVersion = getCashfreeApiVersion();
  return cashfree;
};

const getCashfreeDiagnostics = () => {
  const { clientId, clientSecret } = getCashfreeCredentials();

  return {
    environment: getCashfreeEnvironmentName(),
    apiVersion: getCashfreeApiVersion(),
    clientIdPrefix: clientId.slice(0, 8),
    clientIdLength: clientId.length,
    secretPrefix: clientSecret.slice(0, 12),
    secretLength: clientSecret.length,
    allowInsecureTls: allowInsecureTls(),
  };
};

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

/**
 * Create a Cashfree payment order/session.
 */
const createCashfreeOrder = async ({ orderId, orderAmount, customer, returnUrl }) => {
  const amount = Number(orderAmount);
  if (!orderId) throw new Error('orderId is required');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('orderAmount must be greater than 0');
  if (!customer?.id || !customer?.email || !customer?.phone) {
    throw new Error('customer id, email, and phone are required');
  }

  const request = {
    order_id: `cf_${orderId}`,
    order_amount: Number(amount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: String(customer.id),
      customer_name: customer.name || 'Customer',
      customer_email: customer.email,
      customer_phone: normalizePhone(customer.phone),
    },
    order_meta: {
      return_url: returnUrl,
    },
    order_note: 'Wooden Toys Order Payment',
  };

  const response = await createClient().PGCreateOrder(request);
  return response.data;
};

/**
 * Fetch Cashfree order details to verify payment status.
 */
const verifyCashfreePayment = async (cfOrderId) => {
  if (!cfOrderId) throw new Error('cfOrderId is required');
  const response = await createClient().PGFetchOrder(cfOrderId);
  return response.data;
};

module.exports = {
  createCashfreeOrder,
  verifyCashfreePayment,
  getCashfreeDiagnostics,
};


