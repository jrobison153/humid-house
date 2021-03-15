const {
  SynthUtils,
} = require('@aws-cdk/assert');
const humidHouseStack = require('../lib/bootstrap-stack');
const cachedCsr = require('../lib/adapters/CachedCsr');
const csrFactory = require('../lib/factories/csr-factory');
const cache = require('../test/doubles/Cache');


/**
 * Synth the stack locally with zero dependencies on external systems
 *
 * @return {Promise<void>}
 */
const synth = async () => {

  try {

    const cacheStub = cache();
    const defaultCsrAdapter = cachedCsr(cacheStub);

    csrFactory.setDefaultCsrAdapter(defaultCsrAdapter);

    const stack = await humidHouseStack('SynthedIsolated');

    const synthedStack = SynthUtils.toCloudFormation(stack);

    console.log(JSON.stringify(synthedStack, undefined, 2));
  } catch (e) {
    console.error(e.toLocaleString());
  }
};

synth();
