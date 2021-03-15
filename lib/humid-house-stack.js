const cdk = require('@aws-cdk/core');
const iot = require('@aws-cdk/aws-iot');
const childProcess = require('child_process');
const fs = require('fs');

const RASPBERRY_PI_S01 = 'raspberrypis01';
const RASPBERRY_PI_S01_CERT_ID = `${RASPBERRY_PI_S01}cert`;

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

    const thingProps = {
      thingName: RASPBERRY_PI_S01,
      attributePayload: {
        attributes: {
          location: 'office',
        },
      },
    };

    new iot.CfnThing(this, RASPBERRY_PI_S01, thingProps);

    await this._createCertificate();
  }

  // eslint-disable-next-line require-jsdoc
  async _createCertificate() {

    await this._addThingCertificateToStack();
  }

  // eslint-disable-next-line require-jsdoc
  async _addThingCertificateToStack() {

    const csr = await this.csrAdapter.getCsrForThing(childProcess, fs, RASPBERRY_PI_S01);

    new iot.CfnCertificate(this, RASPBERRY_PI_S01_CERT_ID, {
      status: 'ACTIVE',
      certificateSigningRequest: csr,
    });
  }
}

module.exports = {
  HumidHouseStack,
  RASPBERRY_PI_S01,
  RASPBERRY_PI_S01_CERT_ID,
};
