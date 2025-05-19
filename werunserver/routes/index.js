const express = require('express')
const mysql = require('../work/mysql')
const router = express.Router()


router.get('/', async function (req, res, next) {
  const r = await mysql.query('SELECT  COUNT(*) id FROM  app_express')
  res.render('index',{
    time:r.data[0].id+1
  })
})

router.post('/get', async function (req, res, next) {
  const r = await mysql.query('SELECT  COUNT(*) id FROM  app_express')
  res.json({
    number:r.data[0].id+1
  })
})

/**
 * 查询菜品数据
 */
router.get('/dish', async function (req, res, next) {
  try {
    const result = await mysql.query('SELECT * FROM dish')
    res.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询菜品数据失败',
      error: error.message
    })
  }
})

// ... existing code ...


/**
 * 查询电影数据（新增类型筛选）
 */
router.get('/media', async function (req, res, next) {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      country,       // 国家筛选参数
      genre,         // 剧情类型筛选参数
      category,      // 新增：类型筛选参数(TV/movie)
      sort = 'year', // 排序字段，默认按年份
      order = 'desc' // 排序顺序，默认降序
    } = req.query;

    const offset = (page - 1) * pageSize;
    
    // 构建基础SQL
    let baseSql = 'FROM media WHERE 1=1';
    const params = [];
    
    // 添加筛选条件
    if (country) {
      baseSql += ' AND country = ?';
      params.push(country);
    }
    if (genre) {
      baseSql += ' AND genre LIKE ?';
      params.push(`%${genre}%`);
    }
    // 新增类型筛选条件
    if (category && ['TV', 'movie'].includes(category)) {
      baseSql += ' AND category = ?';
      params.push(category);
    }
    
    // ... existing code ...
    
    res.json({
      success: true,
      data: {
        list: result.data,
        total: countResult.data[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        filters: {
          country,
          genre,
          category // 新增类型筛选参数
        },
        sort: {
          field: sortField,
          order: sortOrder
        }
      }
    });
  } catch (error) {
    // ... existing error handling ...
  }
});

// ... existing code ...


module.exports = router
