module.exports = (fileSystem) => {

  let dataToWriteToFile = [];
  let isUnrecoverableError = false;
  let stderrText;
  let stderrCb;
  let theCommand;
  let theArgs;

  const _setupFileReadAndExit = (command, args, cb) => {

    // make sure that we only read CSR data that was created as the result of an execution of the openSSl
    // commands

    const stubFileData = dataToWriteToFile.find((item) => {

      let foundIt = false;
      if (command === item.command) {

        const hasSameArgs = args.every((arg) => item.args.includes(arg));
        const hasSameLength = args.length === item.args.length;

        foundIt = hasSameArgs && hasSameLength;
      }

      return foundIt;
    });

    if (stubFileData) {

      fileSystem.readFileReturnDataForFilePath(stubFileData.fileName, stubFileData.data);
    }

    cb(0);
  };

  const _writeStderrAndExit = (cb) => {
    stderrCb(stderrText);
    cb(1);
  };

  // TODO: command and args are pass through args, needs refactor/better design
  const _terminateProcess = (command, args, cb) => {

    if (isUnrecoverableError) {
      _writeStderrAndExit(cb);
    } else {
      _setupFileReadAndExit(command, args, cb);
    }
  };

  return {

    spawn: function(command, args) {

      theCommand = command;
      theArgs = args;

      return {

        on: function(event, cb) {

          if (event === 'close') {

            _terminateProcess(command, args, cb);
          }
        },

        stderr: {

          on: (event, cb) => {
            stderrCb = cb;
          },
        },
      };
    },

    // ============== support functions, not part  of the "interface"

    args: () => {
      return theArgs;
    },

    clearDataToWrite: () => {
      dataToWriteToFile = [];
    },

    dataToWriteToFileForSpawn: (command, args, fileName, data) => {
      dataToWriteToFile.push({command, args, fileName, data});
    },

    command: () => {
      return theCommand;
    },

    setupForUnrecoverableError: (stderr) => {
      isUnrecoverableError = true;
      stderrText = stderr;
    },
  };
};
