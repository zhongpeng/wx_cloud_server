const {
  callContainer
} = require('../../utils/api.js');
const {
  errorInfo
} = require('../../utils/error.js');
Page({
  data: {
  },

  async loadDishCategory(){
    try {
      const response = await callContainer('/dishCategory');
      const categoriesData = response.data.data;
      const categories = ['全部',...categoriesData.map(item => item.category)];
      console.log('categories:', categories); // 添加调试日志
      this.setData({
        categories
      });
    } catch (e) {
      errorInfo('加载分类失败')
    }
  },

  onLoad() {
    this.loadDishCategory();
  },

});