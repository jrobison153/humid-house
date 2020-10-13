const cdk = require('@aws-cdk/core');
const iot = require('@aws-cdk/aws-iot');

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
      thingName: 'raspberry-pi-s01',
      attributePayload: {
        attributes: {
          location: 'office',
        },
      },
    };

    new iot.CfnThing(this, 'RaspberryPiS01', thingProps);

    await this._createCertificate();
  }

  // eslint-disable-next-line require-jsdoc
  async _createCertificate() {

    await this._addThingCertificateToStack();
  }

  // eslint-disable-next-line require-jsdoc
  async _addThingCertificateToStack() {

    const csr = await this.csrAdapter.getCsrForThing();

    new iot.CfnCertificate(this, 'ThingCert', {
      status: 'ACTIVE',
      certificateSigningRequest: csr,
    });
  }
}

module.exports = {HumidHouseStack};
