const { randomUUID } = require('crypto');

// JSON fixtures are static, so each call needs a fresh clone plus a unique CorrelationId.
function buildPayloadFromTemplate(template) {
  const payload = JSON.parse(JSON.stringify(template));
  payload.Metadata.CorrelationId = randomUUID();
  return payload;
}

module.exports = { buildPayloadFromTemplate };
