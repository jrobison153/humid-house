module.exports = (fileSystem) => {

  let spawnCount = 1;
  let dataToWriteToFile;
  let isUnrecoverableError = false;
  let stderrText;
  let stderrCb;
  let theCommand;
  let theArgs;

  const setupFileReadAndExit = (cb) => {
    {

      // make sure that we only read CSR data that was created as the result of an execution of the openSSl
      // commands
      let data;

      if (dataToWriteToFile) {
        data = dataToWriteToFile;
      } else {
        data = `Bogus CSR Number ${spawnCount}`;
      }

      fileSystem.readFileQueuePush(data);

      spawnCount++;

      cb(0);
    }
  };

  const writeStderrAndExit = (cb) => {
    stderrCb(stderrText);
    cb(1);
  };

  const terminateProcess = (command, cb) => {

    if (isUnrecoverableError) {
      writeStderrAndExit(cb);
    } else {
      setupFileReadAndExit(cb);
    }
  };

  return {

    spawn: function(command, args) {

      theCommand = command;
      theArgs = args;

      return {

        on: function(event, cb) {

          if (event === 'close') {
            terminateProcess(command, cb);
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

    csrDataToWriteToFile: (data) => {
      dataToWriteToFile = data;
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
