const cdk = require('@aws-cdk/core');
const iot = require('@aws-cdk/aws-iot');
const iam = require('@aws-cdk/aws-iam');
const childProcess = require('child_process');
const fs = require('fs');

const HUMIDITY_TOPIC = 'humidity';
const RASPBERRY_PI_S01 = 'raspberrypis01';
const RASPBERRY_PI_S01_CERT_ID = `${RASPBERRY_PI_S01}cert`;
const RASPBERRY_PI_S01_PRINCIPAL_ATTACHMENT_ID = `${RASPBERRY_PI_S01}principalattachment`;
const RASPBERRY_PI_S01_POLICY_PRINCIPAL_ATTACHMENT_ID = `${RASPBERRY_PI_S01}policyprincipalattachment`;
const IOT_POLICY = `iotpolicies`;
/**
 * The Stack
 */
class HumidHouseStack extends cdk.Stack {

  csrAdapter

  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} stackId
   * @param {cdk.StackProps=} props
   */
  constructor(scope, stackId, props) {

    super(scope, stackId, props);
  }

  /**
   * create the stack
   *
   * @param {object} csrAdapter - object conforming to csr "interface"
   *
   * @return {Promise<void>}
   */
  async buildStack(csrAdapter) {

    this.csrAdapter = csrAdapter;

    this._createThing();

    const policy = this._addIotPolicies();

    await this._createCertificate(policy);
  }

  // eslint-disable-next-line require-jsdoc
  _createThing() {

    const thingProps = {
      thingName: RASPBERRY_PI_S01,
      attributePayload: {
        attributes: {
          location: 'office',
        },
      },
    };

    new iot.CfnThing(this, RASPBERRY_PI_S01, thingProps);
  }

  // eslint-disable-next-line require-jsdoc
  _addIotPolicies() {

    const allowConnectStatement = this._createPolicyStatement(
        iam.Effect.ALLOW,
        ['iot:Connect'],
        [`arn:aws:iot:${this.region}:${this.account}:client/${RASPBERRY_PI_S01}`],
    );

    const allowPubToHumidityTopicStatement = this._createPolicyStatement(
        iam.Effect.ALLOW,
        ['iot:Publish'],
        [`arn:aws:iot:${this.region}:${this.account}:topic/${HUMIDITY_TOPIC}`],
    );

    const iotPolicyDoc = new iam.PolicyDocument();

    iotPolicyDoc.addStatements(allowConnectStatement, allowPubToHumidityTopicStatement);

    const policy = new iot.CfnPolicy(this, IOT_POLICY, {
      policyDocument: iotPolicyDoc,
    });

    return policy;
  }

  // eslint-disable-next-line require-jsdoc
  _createPolicyStatement(effect, actions, resources) {

    const allowConnectStatement = new iam.PolicyStatement();

    allowConnectStatement.effect = effect;
    allowConnectStatement.addActions(actions);
    allowConnectStatement.addResources(resources);

    return allowConnectStatement;
  }

  // eslint-disable-next-line require-jsdoc
  async _createCertificate(policy) {

    const certificate = await this._addThingCertificateToStack();

    new iot.CfnThingPrincipalAttachment(this, RASPBERRY_PI_S01_PRINCIPAL_ATTACHMENT_ID, {
      thingName: {
        Ref: RASPBERRY_PI_S01,
      },
      principal: certificate.attrArn,
    });

    new iot.CfnPolicyPrincipalAttachment(this, RASPBERRY_PI_S01_POLICY_PRINCIPAL_ATTACHMENT_ID, {
      policyName: policy.ref,
      principal: certificate.attrArn,
    });
  }

  // eslint-disable-next-line require-jsdoc
  async _addThingCertificateToStack() {

    const csr = await this.csrAdapter.getCsrForThing(childProcess, fs, RASPBERRY_PI_S01);

    const certificate = new iot.CfnCertificate(this, RASPBERRY_PI_S01_CERT_ID, {
      status: 'ACTIVE',
      certificateSigningRequest: csr,
    });

    return certificate;
  }
}

module.exports = {
  HumidHouseStack,
  HUMIDITY_TOPIC,
  RASPBERRY_PI_S01,
  RASPBERRY_PI_S01_CERT_ID,
  RASPBERRY_PI_S01_PRINCIPAL_ATTACHMENT_ID,
  RASPBERRY_PI_S01_POLICY_PRINCIPAL_ATTACHMENT_ID,
  IOT_POLICY,
};
