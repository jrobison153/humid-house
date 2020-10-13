/* eslint-disable require-jsdoc */
const awsAssert = require('@aws-cdk/assert');
const humidHouseStack = require('../lib/bootstrap-stack');
const {
  countResources,
  haveResource,
  haveResourceLike,
  SynthUtils,
} = awsAssert;
const csr = require('./doubles/Csr');
const csrFactory = require('../lib/factories/csr-factory');

const awsExpect = awsAssert.expect;
const STACK_ID = 'MyTestStack';
const EXPECTED_CSR = 'some bogus csr, yeah this looks nothing like a csr but this is a test so it does not matter';

let defaultCsrAdapter;

beforeEach(async () => {

  const stackName = 'NonExistentStackName';

  defaultCsrAdapter = csr(stackName, EXPECTED_CSR);

  csrFactory.setDefaultCsrAdapter(defaultCsrAdapter);
});

afterEach(() => {

  csrFactory.resetDefaultCsrAdapter();
});


test('whenIsStackGeneratedThenTheIoTThingExists', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(haveResource('AWS::IoT::Thing'));
});

test('whenIsStackGeneratedThenThereIsOnlyOneIoTThing', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(countResources('AWS::IoT::Thing'), 1);
});

test('whenIsStackGeneratedThenThereAnIoTThingWithTheCorrectId', async () => {

  const stack = await humidHouseStack(STACK_ID);

  const synthedStack = SynthUtils.toCloudFormation(stack);

  expect(synthedStack.Resources.RaspberryPiS01).toBeDefined();
});

test('whenIsStackGeneratedThenTheIoTThingHasItsNameSet', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(haveResourceLike('AWS::IoT::Thing', {
    ThingName: 'raspberry-pi-s01',
  }));
});

test('whenIsStackGeneratedThenTheIoTThingHasLocationAttributeSet', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(haveResourceLike('AWS::IoT::Thing', {
    AttributePayload: {
      Attributes: {
        location: 'office',
      },
    },
  }));
});

test('whenStackStackGeneratedThenCertificateAssigned', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(haveResource('AWS::IoT::Certificate', {
    CertificateSigningRequest: EXPECTED_CSR,
  }));
});

test('whenIsStackGeneratedThenCertificateAssignedWithActiveStatus', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(haveResourceLike('AWS::IoT::Certificate', {
    Status: 'ACTIVE',
  }));
});

test('whenIsStackGeneratedThenCertificateAssignedWithCsr', async () => {

  const stack = await humidHouseStack(STACK_ID);

  awsExpect(stack).to(haveResourceLike('AWS::IoT::Certificate', {
    CertificateSigningRequest: EXPECTED_CSR,
  }));
});

// ============ Util Functions ================
