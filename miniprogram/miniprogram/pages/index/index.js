const {
  callContainer
} = require('../../utils/api.js');
const {
  errorInfo
} = require('../../utils/error.js');
Page({
  data: {
    mediaData: {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    },
    filters: {
      countries: '',
      genres: '',
      category: ''
    },
    sort: {
      yearSort: 'desc', // 次排序字段
      ratingSort: 'desc'
    },
    loading: false,
    countries: ['全部'],
    genres: ['全部'],
    categories: ['全部']
  },

  onLoad() {
    this.loadCountries();
    this.loadCategories();
    this.loadMediaGenres();
    this.loadMediaData();
  },

  /**
   * 加载国家数据
   */
  async loadCountries() {
    try {
      const response = await callContainer('/mediaCountries')
      const countriesData = response.data.data;
      const countries = ['全部', ...countriesData.map(item => item.countries)];
      this.setData({
        countries
      });
    } catch (e) {
      errorInfo('加载国家数据失败')
    }
  },

  /**
   * 加载类型数据
   */
  async loadMediaGenres() {
    try {
      const response = await callContainer('/mediaGenres');
      const genresData = response.data.data;
      const genres = ['全部', ...genresData.map(item => item.genres)];
      this.setData({
        genres
      });
    } catch (e) {
      errorInfo('加载类型数据失败')
    }
  },

  async loadCategories() {
    try {
      const response = await callContainer('/category');
      const categoriesData = response.data.data;
      const categories = ['全部', ...categoriesData.map(item => item.category)];
      this.setData({
        categories
      });
    } catch (e) {
      errorInfo('加载分类失败')
    }
  },

  // 重置并重新加载
  resetAndLoad() {
    this.setData({
      'mediaData.list': [],
      'mediaData.page': 1,
      'mediaData.total': 0
    }, () => {
      this.loadMediaData();
    });
  },

  // 加载数据
  async loadMediaData() {
    if (this.data.loading) return;
    this.setData({
      loading: true
    });
    try {
      const {
        page,
        pageSize
      } = this.data.mediaData;
      const {
        countries,
        genres,
        category
      } = this.data.filters;
      const {
        yearSort,
        ratingSort
      } = this.data.sort;
      const path = `/media?page=${page}&pageSize=${pageSize}&countries=${encodeURIComponent(countries)}&genres=${encodeURIComponent(genres)}&category=${category}&yearSort=${yearSort}&ratingSort=${ratingSort}`;
      const response = await callContainer(path)
      const newData = response.data.data;
      console.log('API返回数据:', newData); // 添加调试日志
      this.setData({
        mediaData: {
          list: [...this.data.mediaData.list, ...newData.list],
          total: newData.total,
          page: newData.page,
          pageSize: newData.pageSize
        },
        loading: false
      });
    } catch (e) {
      console.error('加载数据失败:', e);
      this.setData({
        loading: false
      });
    }
  },



  /**
   * 格式化评价人数
   */
  formatRatingCount(count) {
    console.log('当前评分人数:', count); // 添加调试日志
    if (!count) return '0人评分';
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万人评分`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}千人评分`;
    return `${count}人评分`;
  },




  // 国家筛选变化
  handleCountriesChange(e) {
    const value = this.data.countries[e.detail.value];
    this.setData({
      'filters.countries': value === '全部' ? '' : value
    }, () => {
      this.resetAndLoad();
    });
  },

  // 类型筛选变化
  handleGenreChange(e) {
    const value = this.data.genres[e.detail.value];
    this.setData({
      'filters.genres': value === '全部' ? '' : value
    }, () => {
      this.resetAndLoad();
    });
  },

  // 分类筛选变化
  handleCategoryChange(e) {
    const value = this.data.categories[e.detail.value];
    this.setData({
      'filters.category': value === '全部' ? '' : value
    }, () => {
      this.resetAndLoad();
    });
  },


  // 新增排序处理函数
  getNewSortState(prevSort, field) {
    const isSameField = prevSort.primary === field;
    const newOrder = isSameField ?
      (prevSort.primaryOrder === 'asc' ? 'desc' : 'asc') :
      'asc';

    return {
      primary: field,
      primaryOrder: newOrder,
      secondary: isSameField ? prevSort.secondary : field,
      secondaryOrder: isSameField ? prevSort.secondaryOrder : 'desc'
    };
  },

  // 排序变化
  handleSortChange(e) {
    const { field } = e.currentTarget.dataset;
    let yearSort = this.data.sort.yearSort;
    let ratingSort = this.data.ratingSort;
    if (field == 'yead') {
      yearSort = yearSort == "desc" ? "ace" : "desc";
    } else {
      ratingSort = ratingSort == "desc" ? "ace" : "desc";
    }
    this.setData(prev => {
      return {
        sort: {
          yearSort: yearSort,
          ratingSort: ratingSort
        }
      };
    }, () => {
      this.resetAndLoad();
    });
  },

  // 滚动到底部加载更多
  onReachBottom() {
    if (!this.data.loading &&
      this.data.mediaData.list.length < this.data.mediaData.total) {
      this.setData({
        'mediaData.page': this.data.mediaData.page + 1
      }, () => {
        this.loadMediaData();
      });
    }
  }
});