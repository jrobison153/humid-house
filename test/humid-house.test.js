/* eslint-disable require-jsdoc */
const awsAssert = require('@aws-cdk/assert');
const humidHouseStack = require('../lib/bootstrap-stack');
const {RASPBERRY_PI_S01_CERT_ID, RASPBERRY_PI_S01} = require('../lib/humid-house-stack');
const {
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

beforeEach(async () => {

  cacheStub = cache();

  defaultCsrAdapter = cachedCsr(cacheStub);

  csrFactory.setDefaultCsrAdapter(defaultCsrAdapter);
});

afterEach(() => {

  csrFactory.resetDefaultCsrAdapter();
});

describe('When generating the stack', () => {

  test('Then the IoT thing exists', async () => {

    const stack = await humidHouseStack(STACK_ID);

    awsExpect(stack).to(haveResource('AWS::IoT::Thing'));
  });

  test('Then there is only one IoT thing', async () => {

    const stack = await humidHouseStack(STACK_ID);

    awsExpect(stack).to(countResources('AWS::IoT::Thing'), 1);
  });

  test('Then there is an IoT thing with the correct id', async () => {

    const stack = await humidHouseStack(STACK_ID);

    const synthedStack = SynthUtils.toCloudFormation(stack);

    expect(synthedStack.Resources[RASPBERRY_PI_S01]).toBeDefined();
  });

  test('Then the IoT thing has its name set', async () => {

    const stack = await humidHouseStack(STACK_ID);

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Thing', {
      ThingName: RASPBERRY_PI_S01,
    }));
  });

  test('Then the IoT thing has the location attribute set', async () => {

    const stack = await humidHouseStack(STACK_ID);

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Thing', {
      AttributePayload: {
        Attributes: {
          location: 'office',
        },
      },
    }));
  });

  test('Then certificate assigned with active status', async () => {

    const stack = await humidHouseStack(STACK_ID);

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Certificate', {
      Status: 'ACTIVE',
    }));
  });

  describe('And the CSR has not been previously cached', () => {

    test('Then certificate assigned with new CSR', async () => {

      cacheStub.clearCache();

      const stack = await humidHouseStack(STACK_ID);

      const synthedStack = SynthUtils.toCloudFormation(stack);

      expect(synthedStack.Resources[RASPBERRY_PI_S01_CERT_ID].Properties.CertificateSigningRequest)
          .toMatch(/-----BEGIN CERTIFICATE REQUEST-----[\s\S]+-----END CERTIFICATE REQUEST-----/);
    });
  });

  describe('And the stack has been previously generated', () => {

    test('Then the same CSR is used from cache on the second run', async () => {

      cacheStub.clearCache();

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
});

// ============ Util Functions ================
