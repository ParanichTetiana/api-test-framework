const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_08.json');
const patientTemplateWithFacilityPin = require('../testdata/erdx_74752_tc_08_1.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { buildExpectedVaccinationFields } = require('../testdata/vaccinationDataMapper');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');
const { TEST_TIMEOUT_MS } = require('../constants');

const DEFAULTED_COLUMNS = ['VFC_STATUS', 'VTRCKS_PROVIDER_PIN'];

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC8 — REQ-SUCCESS: VTrckSProviderPin omitted, facility has no PIN on file, persists null', async () => {
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

      // REQ-SUCCESS: omitted VfcStatus defaults to V01; omitted VTrckSProviderPin falls back to the
      // facility's on-file PIN (per field spec #12), which is not configured for this facility, so
      // it persists blank — neither omission is left unhandled nor causes the request to be rejected.
      expectDbFieldsToMatch(row, { VFC_STATUS: 'V01' });
      expectDbFieldsToBeBlank(row, ['VTRCKS_PROVIDER_PIN']);

      // Every other field should still persist per baseline, unaffected by the two omissions.
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);
      const baselineFieldsByColumn = Object.fromEntries(
        Object.entries(expectedFieldsByColumn).filter(([column]) => !DEFAULTED_COLUMNS.includes(column))
      );
      expectDbFieldsToMatch(row, baselineFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);

  it('TC8_1 — REQ-SUCCESS: VTrckSProviderPin omitted, facility has PIN on file, persists that PIN', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplateWithFacilityPin);
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

      // REQ-SUCCESS: omitted VfcStatus defaults to V01; omitted VTrckSProviderPin falls back to the
      // facility's on-file PIN (per field spec #12) — here the facility has OH123456 on file, so
      // that value persists instead of blank.
      expectDbFieldsToMatch(row, { VFC_STATUS: 'V01', VTRCKS_PROVIDER_PIN: 'OH123456' });

      // Every other field should still persist per baseline, unaffected by the two omissions.
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);
      const baselineFieldsByColumn = Object.fromEntries(
        Object.entries(expectedFieldsByColumn).filter(([column]) => !DEFAULTED_COLUMNS.includes(column))
      );
      expectDbFieldsToMatch(row, baselineFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
