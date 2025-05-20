const { callContainer } = require('../../utils/api.js');
const { errorInfo } = require('../../utils/error.js');

Page({
  data: {
    categories: []
  },

  onLoad() {
    this.loadCategories();
  },

  async loadCategories() {
    try {
      const response = await callContainer('/dishCategory');
      this.setData({
        categories: response.data.data
      });
    } catch (e) {
      errorInfo('加载分类失败');
    }
  },

  onNameChange(e) {
    const { id } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      categories: this.data.categories.map(item => 
        item.id === id ? {...item, name: value} : item
      )
    });
  },

  addCategory() {
    this.setData({
      categories: [...this.data.categories, {id: Date.now(), name: '', isNew: true}]
    });
  },

  async saveCategory(e) {
    const { id } = e.currentTarget.dataset;
    const category = this.data.categories.find(item => item.id === id);
    
    try {
      if (category.isNew) {
        await callContainer('/addDishCategory', 'POST',{ name: category.name });
      } else {
        await callContainer('/updateCategory','POST', { id, name: category.name }, );
      }
      wx.showToast({ title: '保存成功' });
      this.loadCategories();
    } catch (e) {
      errorInfo('保存失败');
    }
  },

  async deleteCategory(e) {
    const { id } = e.currentTarget.dataset;
    try {
      await callContainer('/deleteCategory',  'POST',{ id },);
      wx.showToast({ title: '删除成功' });
      this.loadCategories();
    } catch (e) {
      errorInfo('删除失败');
    }
  }
});