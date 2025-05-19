Page({
  data: {
    mediaData: {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    },
    loading: false
  },

  onLoad() {
    this.loadMediaData();
  },

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
      const response = await wx.cloud.callContainer({
        path: `/media?page=${page}&pageSize=${pageSize}`,
        method: "GET",
        header: {
          'X-WX-SERVICE': 'ordering-system'
        },
        config: {
          env: "prod-5ghkbwa03964ccbe"
        }
      });
      console.log(response)
      console.log(response.data)
      console.log(response.data.data.list)
      if (!response || !response.data || !response.data.data.list) {
        throw new Error('Invalid response data');
      }
      const newData = response.data.data;
      this.setData({
        mediaData: {
          list: [...this.data.mediaData.list, ...(newData.list || [])], // 确保list存在
          total: newData.total || 0,
          page: newData.page || this.data.mediaData.page + 1,
          pageSize: newData.pageSize || this.data.mediaData.pageSize
        },
        loading: false
      });
    } catch (e) {
      console.error('加载数据失败:', e);
      this.setData({
        loading: false,
        mediaData: {
          ...this.data.mediaData,
          list: this.data.mediaData.list || [] // 确保list有默认值
        }
      });
    }
  },

  onReachBottom() {
    if (!this.data.loading &&
      this.data.mediaData.list.length < this.data.mediaData.total) {
      this.setData({
        mediaData: {
          ...this.data.mediaData,
          page: this.data.mediaData.page + 1
        }
      });
      this.loadMediaData();
    }
  }
});