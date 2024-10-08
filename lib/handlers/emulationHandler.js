const { eventHandler } = require("../eventBus");
const networkHandler = require("./networkHandler");
let emulation;

const createdSessionListener = (client) => {
  emulation = client.Emulation;
};
eventHandler.on("createdSession", createdSessionListener);

const setViewport = async (options) => {
  if (options.height === undefined || options.width === undefined) {
    throw new Error("No height and width provided");
  }
  options.mobile = options.mobile || false;
  options.deviceScaleFactor = options.deviceScaleFactor || 1;
  options.screenOrientation =
    options.screenOrientation || options.isLandscape
      ? { angle: 90, type: "landscapePrimary" }
      : { angle: 0, type: "portraitPrimary" };
  const hasTouch = options.hasTouch || false;
  await Promise.all([
    emulation.setDeviceMetricsOverride(options),
    emulation.setTouchEmulationEnabled({ enabled: hasTouch }),
  ]);
};

const setTimeZone = async (timezone) => {
  try {
    await emulation.setTimezoneOverride({ timezoneId: timezone });
  } catch (exception) {
    if (exception.message.includes("Invalid timezone")) {
      throw new Error(`Invalid timezone ID: ${timezone}`);
    }
    throw exception;
  }
};

const setLocation = async (options) => {
  const { longitude, latitude, accuracy = 0 } = options;
  if (longitude < -180 || longitude > 180) {
    throw new Error(
      `Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`,
    );
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error(
      `Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`,
    );
  }
  if (accuracy < 0) {
    throw new Error(
      `Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`,
    );
  }
  await emulation
    .setGeolocationOverride({ longitude, latitude, accuracy })
    .catch((err) => {
      throw new Error(err);
    });
};

const emulateDevice = async (deviceModel) => {
  const devices = require("../data/devices").default;
  const deviceEmulate = devices[deviceModel];
  const deviceNames = Object.keys(devices);
  if (deviceEmulate === undefined) {
    throw new Error(
      `Please set one of the given device models \n${deviceNames.join("\n")}`,
    );
  }
  await Promise.all([
    setViewport(deviceEmulate.viewport),
    networkHandler.setUserAgent(deviceEmulate),
  ]);
};

module.exports = { setLocation, setViewport, setTimeZone, emulateDevice };
