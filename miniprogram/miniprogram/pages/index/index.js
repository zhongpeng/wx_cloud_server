Page({
  data: {
    mediaData: {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    },
    filters: {
      country: '',
      genre: '',
      category: ''
    },
    sort: {
      field: 'year',
      order: 'desc'
    },
    loading: false
  },

  onLoad() {
    this.loadMediaData();
  },

  // 筛选条件变化
  handleFilterChange(e) {
    const { field, value } = e.detail;
    this.setData({
      filters: {
        ...this.data.filters,
        [field]: value
      }
    }, () => {
      this.resetAndLoad();
    });
  },

  // 排序变化
  handleSortChange(e) {
    this.setData({
      sort: e.detail
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
      const { country, genre, category } = this.data.filters;
      const { field, order } = this.data.sort;
      
      const response = await wx.cloud.callContainer({
        path: `/media?page=${page}&pageSize=${pageSize}&country=${country}&genre=${genre}&category=${category}&sort=${field}&order=${order}`,
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