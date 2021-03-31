const cdk = require('@aws-cdk/core');
const csrFactory = require('./factories/csr-factory');
const {HumidHouseStack} = require('../lib/humid-house-stack');

/**
 * @param {string} stackName
 * @return {Promise<HumidHouseStack|void>}
 */
module.exports = async (
    /* istanbul ignore next */
    stackName = 'HumidHouseStack',
) => {

  const app = new cdk.App();

  const tags = {
    'app': 'humid-house',
  };

  const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  };

  const stack = new HumidHouseStack(app, stackName, {tags, env});

  const csrAdapter = csrFactory.getDefaultCsrAdapter();

  await stack.buildStack(csrAdapter);

  return stack;
};
