module.exports = () => {

  const readFileData = {};
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

        cb(null, readFileData[path]);
      }
    },

    // ======= Stub Utility Functions ===========================

    fileRead: () => {
      return theFileRead;
    },

    readFileOptions: () => {
      return theFileReadOptions;
    },

    readFileReturnDataForFilePath: (fileName, data) => {
      readFileData[fileName] = data;
    },

    setupForUnrecoverableError: (err) => {

      isUnrecoverableError = true;

      errText = err;
    },
  };
};
