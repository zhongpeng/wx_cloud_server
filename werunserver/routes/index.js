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

/**
 * 查询电影数据
 */
router.get('/media', async function (req, res, next) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    // 查询总数
    const countResult = await mysql.query('SELECT COUNT(*) as total FROM media');
    // 查询分页数据
    const result = await mysql.query('SELECT * FROM media LIMIT ?, ?', [offset, parseInt(pageSize)]);
    res.json({
      success: true,
      data: {
        list: result.data,
        total: countResult.data[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询电影数据失败',
      error: error.message
    });
  }
});


module.exports = router
