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

  const stack = new HumidHouseStack(app, stackName, {tags});

  const csrAdapter = csrFactory.getDefaultCsrAdapter();

  await stack.buildStack(csrAdapter);

  return stack;
};
