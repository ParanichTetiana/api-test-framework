const { randomUUID } = require('crypto');

function buildNewRxPayload() {
  return {
    Metadata: {
      CorrelationId: randomUUID(),
      SourceId: 'VAPI',
      MessageType: 'NewRx',
      OriginCode: 'Electronic',
    },
    Pharmacy: {
      NcpdpNumber: '4512895',
      NPI: '1295786432',
    },
    Patient: {
      Addresses: [
        {
          Type: 'Home',
          Line1: '444 PARK AVE 8',
          Line2: '',
          City: 'NEW YORK',
          State: 'NY',
          ZipCode: '10016',
        },
      ],
      Phones: [
        {
          Type: 'Home',
          Number: '2125874123',
        },
      ],
      AdditionalInformation: [],
      FirstName: 'ADA',
      LastName: 'SHELBY',
      DateOfBirth: '08/10/1986',
      Gender: 'F',
      SocialSecurityNumber: '',
      EmailAddress: '',
      Race: [],
      Ethnicity: '',
      ExistingPatient: true,
    },
    Physician: {
      FacilityName: 'PEAKY_BLINDERS',
      Sln: '',
      SlnState: 'NJ',
      SlnExpirationDate: '',
      Dea: '',
      Npi: '1053857706',
      Specialty: '',
      Addresses: [
        {
          Type: 'Office',
          Line1: '350W 50TH ST',
          Line2: '',
          City: 'NEW YORK',
          State: 'NY',
          ZipCode: '10019',
        },
      ],
      Phones: [
        {
          Type: 'Work',
          Number: '2125478635',
          Extension: '',
        },
      ],
      Faxes: [
        {
          Type: 'Work',
          Number: '2125478635',
          Extension: null,
        },
      ],
      ContactFirstName: '',
      ContactLastName: '',
      ContactPhone: null,
      ContactFax: null,
      FirstName: 'ARTHUR',
      LastName: 'SHELBY',
      MiddleInitial: null,
      DateOfBirth: '',
      Gender: null,
      EmailAddress: null,
      Prefix: null,
      Suffix: null,
    },
    RxInformation: [
      {
        RxType: 'NewRx',
        Ndc: '58160088452',
        ProductName: 'FLUARIX TRIVALENT',
        QuantityWritten: '1',
        DaysSupply: 30,
        RefillsWritten: '2',
        RxWrittenDate: '09/03/2026',
        NeedDate: '09/11/2026',
        QuantityDispensed: '',
        Directions: 'INJ 0.5ML IM X1 DOSE',
        PromiseTime: '09/03/2026 09:45 AM -0700',
        AdditionalInformation: [
          { Key: 'test1', Value: 'value1' },
          { Key: 'test2', Value: 'value2' },
        ],
      },
    ],
  };
}

module.exports = { buildNewRxPayload };
