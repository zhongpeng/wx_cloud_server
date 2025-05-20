const errorInfo = (info) => {
  console.error(info+"：", e);
  wx.showToast({
    title: info,
    icon: 'none'
  });
}

module.exports = {
  errorInfo
}