const callContainer = (path, method, data = null) => {
  method = method?method:'GET'
  return wx.cloud.callContainer({
    path,
    method,
    data,
    header: {
      'X-WX-SERVICE': 'ordering-system'
    },
    config: {
      env: "prod-5ghkbwa03964ccbe",
      timeout: 15000
    }
  });
}

module.exports = {
  callContainer
}