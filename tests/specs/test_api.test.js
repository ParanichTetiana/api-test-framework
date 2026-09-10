const apiClient = require('../../utils/apiClient');
const { buildNewRxPayload } = require('../testdata/newRxPayload');
const { initPool, query, closePool } = require('../db/connections');

describe('Authentication Feature', () => {
  it('should get an access token', () => {
    expect(process.env.ACCESS_TOKEN).toBeDefined();
  });
});

describe('NewRx Submission', () => {
  it('should submit a NewRx and receive a success response', async () => {
    const submitResponse = await apiClient.post('', buildNewRxPayload());

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.data.status).toBe('SUCCESS');
    expect(submitResponse.data.data[0].errors).toEqual([]);
  });
});

describe('NewRx Submission - DB Verification', () => {
  const MAX_QUERY_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 2000;

  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it(
    'should persist the submitted vaccination data in the DB',
    async () => {
      const newRxPayload = buildNewRxPayload();
      const submitResponse = await apiClient.post('', newRxPayload);
      console.log('NewRx response:', submitResponse.status, submitResponse.data);
      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data.status).toBe('SUCCESS');

      const { correlationId } = submitResponse.data;
      const { LastName: expectedProviderLastName } =
        newRxPayload.RxInformation[0].VaccinationData.AdministeringProvider;
      console.log(
        'Looking up CORRELATION_ID:',
        correlationId,
        '- expecting PROVIDER_L_NAME:',
        expectedProviderLastName
      );

      // Allow the write pipeline a moment to persist before the row is queryable.
      let providerLastNameRows = [];
      for (
        let attemptNumber = 0;
        attemptNumber < MAX_QUERY_ATTEMPTS && providerLastNameRows.length === 0;
        attemptNumber += 1
      ) {
        if (attemptNumber > 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
        providerLastNameRows = await query(
          `SELECT vd.PROVIDER_L_NAME
           FROM TREXONE_DATA.EREFERRAL_ORDER eo
           JOIN TREXONE_DATA.EREFERRAL_ITEM ei ON ei.EREFERRAL_ORDER_NUM = eo.EREFERRAL_ORDER_NUM
           JOIN TREXONE_DATA.VACCINATION_DETAIL vd ON vd.RX_RECORD_NUM = ei.RX_RECORD_NUM
           WHERE eo.CORRELATION_ID = :correlationId`,
          [correlationId]
        );
        console.log('providerLastNameRows', providerLastNameRows);
      }

      expect(providerLastNameRows.length).toBeGreaterThan(0);
      expect(providerLastNameRows[0].PROVIDER_L_NAME).toBe(expectedProviderLastName);
    },
    30000
  );
});
