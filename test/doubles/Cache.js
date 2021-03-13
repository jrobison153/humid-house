module.exports = () => {

  let cache = {};

  let isCacheGetUnrecoverableError = false;
  let isCachePutUnrecoverableError = false;

  return {
    getSecretValue: (params, cb) => {

      let err = null;
      let data = null;

      if (isCacheGetUnrecoverableError) {

        err = new Error('Something really bad happened');
      } else if (cache[params.SecretId]) {

        data = {
          SecretString: cache[params.SecretId],
        };

      } else {

        err = new Error(`Secret with id ${params.SecretId} not found`);

        err.code = 'ResourceNotFoundException';
      }

      cb(err, data);
    },

    putSecretValue: (params, cb) => {

      let err = null;

      if (isCachePutUnrecoverableError) {

        err = new Error('Bad stuff happened trying to put object in cache');
      } else {

        cache[params.SecretId] = params.SecretString;
      }


      cb(err, {});
    },

    // ============ Utility functions, not part of cache interface

    clearCache: () => {
      cache = {};
    },

    getCachedEntryForKey: (key) => {
      return cache[key];
    },

    setCachedCsrHitForThing: (thingName, identity) => {
      cache[thingName] = identity;
    },

    setupGetForUnrecoverableError: () => {

      isCacheGetUnrecoverableError = true;
    },

    setupPutForUnrecoverableError: () => {

      isCachePutUnrecoverableError = true;
    },
  };
};
