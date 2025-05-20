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
      countries,
      genres,
      category,
      sort = 'year',
      order = 'desc'
    } = req.query;

    // 1. 添加参数验证
    if (pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: 'pageSize最大不能超过100'
      });
    }

    const offset = (page - 1) * pageSize;
    let baseSql = 'FROM media WHERE 1=1';
    const params = [];
    
    // 2. 优化SQL查询条件
    if (countries) {
      baseSql += ' AND countries = ?';
      params.push(countries);
    }
    if (genres) {
      baseSql += ' AND genres LIKE ?';
      params.push(`%${genres}%`);
    }
    if (category && ['TV', 'movie'].includes(category)) {
      baseSql += ' AND category = ?';
      params.push(category);
    }
    
    // 3. 分两个独立查询提高性能
    const [countResult, result] = await Promise.all([
      mysql.query(`SELECT COUNT(*) as total ${baseSql}`, params),
      mysql.query(
        `SELECT id, title, thumbnail, year, rating, countries, genres, category 
         ${baseSql} 
         ORDER BY ${mysql.escapeId(sort)} ${order === 'asc' ? 'ASC' : 'DESC'} 
         LIMIT ?, ?`, 
        [...params, offset, parseInt(pageSize)]
      )
    ]);

    res.json({
      success: true,
      data: {
        list: result.data,
        total: countResult.data[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        filters: { countries, genres, category },
        sort: { field: sort, order }
      }
    });
    
  } catch (error) {
    console.error('媒体查询错误:', error);
    res.status(500).json({
      success: false,
      message: '查询失败，请稍后再试',
      error: error.message
    });
  }
});

module.exports = router
