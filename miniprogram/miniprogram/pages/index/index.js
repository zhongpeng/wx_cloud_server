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
      field: 'year',
      order: 'desc'
    },
    loading: false,
    countries: ['全部', '中国', '美国', '日本', '韩国', '英国'],
    genres: ['全部', '动作', '喜剧', '爱情', '科幻', '恐怖'],
    categories: ['全部', 'TV', 'movie']
  },

  onLoad() {
    this.loadMediaData();
  },

  // 国家筛选变化
  handlecountriesChange(e) {
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

  // 排序变化
  handleSortChange(e) {
    const { field, order } = e.currentTarget.dataset;
    this.setData({
      sort: { field, order }
    }, () => {
      this.resetAndLoad();
    });
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
    this.setData({ loading: true });
    try {
      const { page, pageSize } = this.data.mediaData;
      const { countries, genres, category } = this.data.filters;
      const { field, order } = this.data.sort;
      
      const response = await wx.cloud.callContainer({
        path: `/media?page=${page}&pageSize=${pageSize}&countries=${encodeURIComponent(countries)}&genres=${encodeURIComponent(genres)}&category=${category}&sort=${field}&order=${order}`,
        method: "GET",
        header: {
          'X-WX-SERVICE': 'ordering-system'
        },
        config: {
          env: "prod-5ghkbwa03964ccbe",
          timeout:15000
        }
      });
      
      const newData = response.data.data;
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
      this.setData({ loading: false });
    }
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