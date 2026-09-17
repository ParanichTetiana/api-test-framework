const apiClient = require('../../utils/apiClient');
const { TEST_TIMEOUT_MS } = require('../constants');
const patientTemplate = require('../testdata/erdx_74752_tc_02.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC2 — Legacy payload, VaccinationData block entirely absent', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data.status).toBe('SUCCESS');
      expect(submitResponse.data.data[0].errors).toEqual([]);

      const { correlationId } = submitResponse.data;

      // Confirms the legacy flow still processed the Rx as before, unaffected by the omitted VaccinationData block.
      const orderItemRows = await fetchOrderItemByCorrelationId(correlationId);
      expect(orderItemRows.length).toBeGreaterThan(0);

      const vaccinationRows = await fetchVaccinationDetailByCorrelationId(correlationId);
      expect(vaccinationRows.length).toBe(0);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});

