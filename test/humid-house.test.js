/* eslint-disable require-jsdoc */
const awsAssert = require('@aws-cdk/assert');
const humidHouseStack = require('../lib/bootstrap-stack');
const {
  HUMIDITY_TOPIC,
  IOT_POLICY,
  RASPBERRY_PI_S01_CERT_ID,
  RASPBERRY_PI_S01,
  RASPBERRY_PI_S01_PRINCIPAL_ATTACHMENT_ID,
  RASPBERRY_PI_S01_POLICY_PRINCIPAL_ATTACHMENT_ID,
} = require('../lib/humid-house-stack');
const {
  arrayWith,
  beASupersetOfTemplate,
  countResources,
  haveResource,
  haveResourceLike,
  objectLike,
  SynthUtils,
} = awsAssert;
const cachedCsr = require('../lib/adapters/CachedCsr');
const csrFactory = require('../lib/factories/csr-factory');
const cache = require('./doubles/Cache');

const awsExpect = awsAssert.expect;
const STACK_ID = 'MyTestStack';
const BOGUS_ACCOUNT_ID = '123456789';
const BOGUS_ACCOUNT_REGION = 'mykitchen';

describe('When generating the stack', () => {

  let defaultCsrAdapter;
  let cacheStub;
  let stack;

  afterEach(() => {

    csrFactory.resetDefaultCsrAdapter();
  });

  beforeEach(async () => {

    cacheStub = cache();

    defaultCsrAdapter = cachedCsr(cacheStub);

    csrFactory.setDefaultCsrAdapter(defaultCsrAdapter);

    process.env.CDK_DEFAULT_ACCOUNT = BOGUS_ACCOUNT_ID;
    process.env.CDK_DEFAULT_REGION = BOGUS_ACCOUNT_REGION;

    stack = await humidHouseStack(STACK_ID);
  });

  test('Then the humid-house app tag is applied to the stack', () => {

    const tags = stack.tags;

    const renderedTags = tags.renderTags();

    expect(renderedTags).toEqual(expect.arrayContaining([{Key: 'app', Value: 'humid-house'}]));
  });

  test('Then the stack account is set to the value of the CDK_DEFAULT_ACCOUNT', () => {

    expect(stack.account).toEqual(BOGUS_ACCOUNT_ID);
  });

  test('Then the stack region is set to the value of the CDK_DEFAULT_REGION', () => {

    expect(stack.region).toEqual(BOGUS_ACCOUNT_REGION);
  });

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
        [RASPBERRY_PI_S01_PRINCIPAL_ATTACHMENT_ID]: {
          Type: 'AWS::IoT::ThingPrincipalAttachment',
          Properties: {
            ThingName: {
              Ref: RASPBERRY_PI_S01,
            },
            Principal: {
              'Fn::GetAtt': [
                RASPBERRY_PI_S01_CERT_ID,
                'Arn',
              ],
            },
          },
        },
      },
    }));
  });

  test('Then the policy is attached to the certificate', () => {

    awsExpect(stack).to(haveResourceLike('AWS::IoT::PolicyPrincipalAttachment', {
      PolicyName: {
        Ref: IOT_POLICY,
      },
      Principal: {
        'Fn::GetAtt': [
          RASPBERRY_PI_S01_CERT_ID,
          'Arn',
        ],
      },
    }));
  });

  test('Then there is an PolicyPrincipalAttachment with the correct id', async () => {

    const synthedStack = SynthUtils.toCloudFormation(stack);
    expect(synthedStack.Resources[RASPBERRY_PI_S01_POLICY_PRINCIPAL_ATTACHMENT_ID]).toBeDefined();
  });

  test('Then the thing is granted permission to connect to IoT Core', () => {

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Policy', {
      PolicyDocument: {
        Statement: arrayWith(objectLike(
            {
              Effect: 'Allow',
              Action: [
                'iot:Connect',
              ],
              Resource: [
                `arn:aws:iot:${BOGUS_ACCOUNT_REGION}:${BOGUS_ACCOUNT_ID}:client/${RASPBERRY_PI_S01}`,
              ],
            }),
        ),
      },
    }));
  });

  test('Then the thing is granted permission to publish to the humidity topic', () => {

    awsExpect(stack).to(haveResourceLike('AWS::IoT::Policy', {
      PolicyDocument: {
        Statement: arrayWith(objectLike(
            {
              Effect: 'Allow',
              Action: [
                'iot:Publish',
              ],
              Resource: [
                `arn:aws:iot:${BOGUS_ACCOUNT_REGION}:${BOGUS_ACCOUNT_ID}:topic/${HUMIDITY_TOPIC}`,
              ],
            }),
        ),
      },
    }));
  });
});
