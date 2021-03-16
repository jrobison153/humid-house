/* eslint-disable require-jsdoc */
const awsAssert = require('@aws-cdk/assert');
const humidHouseStack = require('../lib/bootstrap-stack');
const {
  RASPBERRY_PI_S01_CERT_ID,
  RASPBERRY_PI_S01,
  RASPBERRY_PI_S01_PRINCIPAL_ATTACHEMENT_ID,
} = require('../lib/humid-house-stack');
const {
  beASupersetOfTemplate,
  countResources,
  haveResource,
  haveResourceLike,
  SynthUtils,
} = awsAssert;
const cachedCsr = require('../lib/adapters/CachedCsr');
const csrFactory = require('../lib/factories/csr-factory');
const cache = require('./doubles/Cache');

const awsExpect = awsAssert.expect;
const STACK_ID = 'MyTestStack';

let defaultCsrAdapter;
let cacheStub;
let stack;

beforeEach(async () => {

  cacheStub = cache();

  defaultCsrAdapter = cachedCsr(cacheStub);

  csrFactory.setDefaultCsrAdapter(defaultCsrAdapter);

  stack = await humidHouseStack(STACK_ID);
});

afterEach(() => {

  csrFactory.resetDefaultCsrAdapter();
});

describe('When generating the stack', () => {

  test('Then the IoT thing exists', async () => {

    awsExpect(stack).to(haveResource('AWS::IoT::Thing'));
  });

  test('Then there is only one IoT thing', async () => {

    awsExpect(stack).to(countResources('AWS::IoT::Thing'), 1);
  });

  test('Then there is an IoT thing with the correct id', async () => {

    const synthedStack = SynthUtils.toCloudFormation(stack);

    expect(synthedStack.Resources[RASPBERRY_PI_S01]).toBeDefined();
  });

  test('Then the IoT thing has its name set', async () => {

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Thing', {
      ThingName: RASPBERRY_PI_S01,
    }));
  });

  test('Then the IoT thing has the location attribute set', async () => {

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Thing', {
      AttributePayload: {
        Attributes: {
          location: 'office',
        },
      },
    }));
  });

  test('Then certificate assigned with active status', async () => {

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Certificate', {
      Status: 'ACTIVE',
    }));
  });

  describe('And the CSR has not been previously cached', () => {

    test('Then certificate assigned with new CSR', async () => {

      const synthedStack = SynthUtils.toCloudFormation(stack);

      expect(synthedStack.Resources[RASPBERRY_PI_S01_CERT_ID].Properties.CertificateSigningRequest)
          .toMatch(/-----BEGIN CERTIFICATE REQUEST-----[\s\S]+-----END CERTIFICATE REQUEST-----/);
    });
  });

  describe('And the stack has been previously generated', () => {

    test('Then the same CSR is used from cache on the second run', async () => {

      const firstStack = await humidHouseStack(STACK_ID);

      const firstSynthedStack = SynthUtils.toCloudFormation(firstStack);

      const initiallyCreatedCsr = firstSynthedStack
          .Resources[RASPBERRY_PI_S01_CERT_ID].Properties.CertificateSigningRequest;

      const secondStack = await humidHouseStack(STACK_ID);

      const secondSynthedStack = SynthUtils.toCloudFormation(secondStack);

      const cachedHitCsr = secondSynthedStack.Resources[RASPBERRY_PI_S01_CERT_ID].Properties.CertificateSigningRequest;

      expect(initiallyCreatedCsr).toEqual(cachedHitCsr);
    });
  });

  test('Then the Thing is attached to the x.509 principal', () => {

    awsExpect(stack).to(beASupersetOfTemplate({
      Resources: {
        [RASPBERRY_PI_S01_PRINCIPAL_ATTACHEMENT_ID]: {
          Type: 'AWS::IoT::ThingPrincipalAttachment',
          Properties: {
            ThingName: {
              Ref: RASPBERRY_PI_S01,
            },
            Principal: {
              Ref: RASPBERRY_PI_S01_CERT_ID,
            },
          },
        },
      },
    }));
  });
});
