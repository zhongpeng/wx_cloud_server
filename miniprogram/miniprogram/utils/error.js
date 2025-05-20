const errorInfo = (info) => {
  wx.showToast({
    title: info,
    icon: 'none'
  });
}

module.exports = {
  errorInfo
}