
function log(tag, message, ...rest) {
  console.log(tag + ": " + message, ...rest);
}

function logd(tag, message, ...rest) {
  console.debug(tag + ": " + message, ...rest);
}

function logi(tag, message, ...rest) {
  console.info(tag + ": " + message, ...rest);
}

function logw(tag, message, ...restny) {
  console.warn(tag + ": " + message, ...rest);
}

function loge(tag, message, ...rest) {
  console.error(tag + ": " + message, ...rest);
}

module.exports = { log, logd, logi, logw, loge }
