// ... existing code ...

Page({
  data: {
    accessCount: '-',
    mediaData: {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    },
    loading: false
  },

  // ... existing functions ...

  // 获取电影数据
  async fetchMediaData(page = 1) {
    try {
      this.setData({ loading: true });
      const response = await wx.cloud.callContainer({
        path: `/media?page=${page}&pageSize=${this.data.mediaData.pageSize}`,
        method: "GET",
        header: {
          'X-WX-SERVICE': 'ordering-system'
        },
        config: {
          env: "prod-5ghkbwa03964ccbe"
        }
      });
      return response.data;
    } catch (e) {
      console.error('获取电影数据失败:', e);
      throw e;
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载更多电影数据
  async loadMoreMedia() {
    if (this.data.loading || 
        this.data.mediaData.list.length >= this.data.mediaData.total) {
      return;
    }
    
    const nextPage = this.data.mediaData.page + 1;
    const result = await this.fetchMediaData(nextPage);
    
    this.setData({
      mediaData: {
        list: [...this.data.mediaData.list, ...result.list],
        total: result.total,
        page: nextPage,
        pageSize: result.pageSize
      }
    });
  },

  onShow: async function() {
    // ... existing code ...
    
    // 初始化加载电影数据
    const mediaData = await this.fetchMediaData();
    this.setData({ mediaData });
  }
});