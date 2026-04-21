const crypto = require('crypto');

const VNP_VERSION = '2.1.0';
const VNP_COMMAND = 'pay';

const pad2 = (n) => String(n).padStart(2, '0');

const formatVnpDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
};

const encodeVnp = (value) =>
  encodeURIComponent(String(value)).replace(/%20/g, '+');

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
};

const buildQuery = (params) =>
  Object.keys(params)
    .map((key) => `${encodeVnp(key)}=${encodeVnp(params[key])}`)
    .join('&');

const getClientIp = (req) => {
  const xf = req.headers['x-forwarded-for'];
  if (xf && typeof xf === 'string') return xf.split(',')[0].trim();
  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

const signParams = (params, secret) => {
  const signData = buildQuery(sortObject(params));
  return crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
};

const verifySecureHash = (vnpParams, secret) => {
  const input = { ...vnpParams };
  const secureHash = input.vnp_SecureHash;
  delete input.vnp_SecureHash;
  delete input.vnp_SecureHashType;

  const computed = signParams(input, secret);
  return { ok: computed === secureHash, computed, secureHash };
};

const createPaymentUrl = ({
  baseUrl,
  tmnCode,
  secret,
  amountVnd,
  txnRef,
  orderInfo,
  returnUrl,
  ipAddr,
  locale = 'vn',
  bankCode,
  createDate = new Date(),
  expireMinutes = 15,
}) => {
  const amount = Math.round(Number(amountVnd || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount for VNPAY');
  }

  const now = createDate instanceof Date ? createDate : new Date(createDate);
  const expireDate = new Date(now.getTime() + expireMinutes * 60 * 1000);

  const params = {
    vnp_Version: VNP_VERSION,
    vnp_Command: VNP_COMMAND,
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(amount * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(txnRef),
    vnp_OrderInfo: String(orderInfo),
    vnp_OrderType: 'other',
    vnp_Locale: locale,
    vnp_ReturnUrl: String(returnUrl),
    vnp_IpAddr: String(ipAddr || '127.0.0.1'),
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(expireDate),
  };

  if (bankCode) params.vnp_BankCode = String(bankCode);

  const secureHash = signParams(params, secret);
  const url = `${baseUrl}?${buildQuery(sortObject(params))}&vnp_SecureHash=${secureHash}`;

  return { url, params, secureHash };
};

module.exports = {
  createPaymentUrl,
  verifySecureHash,
  getClientIp,
  formatVnpDate,
};

