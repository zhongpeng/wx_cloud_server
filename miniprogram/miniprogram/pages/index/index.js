const {
  callContainer
} = require('../../utils/api.js');
const {
  errorInfo
} = require('../../utils/error.js');

Page({
  data: {
    categories: [],
    dishList: [],
    activeCategory: null,
    loading: false
  },

  async loadDishCategory() {
    try {
      const response = await callContainer('/dishCategory');
      const categoriesData = response.data.data;
      const categories = [...categoriesData.map(item => item)];
      this.setData({
        categories
      });
      // 默认加载第一个分类的菜品
      if (categories.length > 0) {
        this.setData({ activeCategory: categories[0].id });
        this.loadDishesByCategory(categories[0].id);
      }
    } catch (e) {
      errorInfo('加载分类失败');
    }
  },

  async loadDishesByCategory(categoryId) {
    this.setData({ loading: true });
    try {
      const response = await callContainer(`/dish?category=${categoryId}`);
      this.setData({
        dishList: response.data.data,
        loading: false
      });
    } catch (e) {
      errorInfo('加载菜品失败');
      this.setData({ loading: false });
    }
  },

  handleCategoryChange(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      activeCategory: categoryId
    }, () => {
      this.loadDishesByCategory(categoryId);
    });
  },

  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const dishList = this.data.dishList.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    this.setData({ dishList });
  },

  addToCart(e) {
    const id = e.currentTarget.dataset.id;
    // 这里添加购物车逻辑
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
    });
  },

  showAddCategoryDialog() {
    wx.showModal({
      title: '添加分类',
      content: '请输入分类名称',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          // 调用添加分类API
          console.log('添加分类:', res.content);
        }
      }
    });
  },

  async addDishCategory(name) {
    try {
      const response = await callContainer('/addDishCategory', {
        name: name
      }, 'POST');
      
      if (response.data.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
        // 重新加载分类数据
        this.loadDishCategory();
      }
    } catch (e) {
      errorInfo('添加分类失败');
    }
  },

  showAddCategoryDialog() {
    wx.showModal({
      title: '添加分类',
      content: '请输入分类名称',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          this.addDishCategory(res.content);
        }
      }
    });
  },

  onLoad() {
    this.loadDishCategory();
  }
});