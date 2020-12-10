module.exports = () => {

  const cache = {};

  let cachedCsr;
  let cacheHitThingName;
  let isUnrecoverableError = false;

  return {
    getSecretValue: (params, cb) => {

      let err = null;
      let data = null;

      if (isUnrecoverableError) {

        err = new Error('Something really bad happened');
      } else if (params.SecretId !== cacheHitThingName) {

        err = new Error(`Secret with id ${params.SecretId} not found`);

        err.code = 'ResourceNotFoundException';
      } else {

        data = {SecretString: cachedCsr};
      }

      cb(err, data);
    },

    putSecretValue: (params, cb) => {

      cache[params.SecretId] = params.SecretString;

      cb(null, {});
    },

    // ============ Utility functions, not part of cache interface

    clearCache: () => {

      cachedCsr = '';
      cacheHitThingName = '';
    },

    getCachedEntryForKey: (key) => {

      return cache[key];
    },

    setCachedCsrHitForThing: (thingName, csr) => {
      cachedCsr = csr;
      cacheHitThingName = thingName;
    },

    setupForUnrecoverableError: () => {

      isUnrecoverableError = true;
    },
  };
};
