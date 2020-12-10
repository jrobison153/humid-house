module.exports = () => {

  const readFileQueue = [];
  let queueIndex = 0;
  let errText = '';
  let isUnrecoverableError = false;
  let theFileRead = '';
  let theFileReadOptions = '';

  return {

    readFile: (path, enc, cb) => {

      theFileRead = path;
      theFileReadOptions = enc;

      if (isUnrecoverableError) {

        const error = new Error(errText);
        cb(error, null);
      } else {

        cb(null, readFileQueue[queueIndex]);
        queueIndex++;
      }
    },

    // ======= Stub Utility Functions ===========================

    fileRead: () => {
      return theFileRead;
    },

    readFileOptions: () => {
      return theFileReadOptions;
    },

    readFileQueuePush: (fileData) => {
      readFileQueue.push(fileData);
    },

    setupForUnrecoverableError: (err) => {

      isUnrecoverableError = true;

      errText = err;
    },
  };
};
