const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_05.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { buildExpectedVaccinationFields } = require('../testdata/vaccinationDataMapper');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');
const { TEST_TIMEOUT_MS, FORMAT_LENGTH_INVALID_COLUMNS } = require('../constants');

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC5 — Every format/length-constrained field invalid, everything else valid', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data.status).toBe('SUCCESS');
      expect(submitResponse.data.data[0].errors).toEqual([]);

      const { correlationId } = submitResponse.data;

      // Confirms the legacy flow still processed the Rx as before.
      const orderItemRows = await fetchOrderItemByCorrelationId(correlationId);
      expect(orderItemRows.length).toBeGreaterThan(0);

      const vaccinationRows = await fetchVaccinationDetailByCorrelationId(correlationId);
      expect(vaccinationRows.length).toBeGreaterThan(0);
      const [row] = vaccinationRows;

      // Format/length-invalid fields should persist blank rather than the sent (invalid) value.
      expectDbFieldsToBeBlank(row, FORMAT_LENGTH_INVALID_COLUMNS);

      // Every other (baseline-valid) field should still persist correctly — no cascade failure.
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);
      const validFieldsByColumn = Object.fromEntries(
        Object.entries(expectedFieldsByColumn).filter(([column]) => !FORMAT_LENGTH_INVALID_COLUMNS.includes(column))
      );
      expectDbFieldsToMatch(row, validFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});

