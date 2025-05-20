const express = require('express')
const mysql = require('../work/mysql')
const router = express.Router()

router.get('/', async function (req, res, next) {
  const r = await mysql.query('SELECT  COUNT(*) id FROM  app_express')
  res.render('index', {
    time: r.data[0].id + 1
  })
})

router.post('/get', async function (req, res, next) {
  const r = await mysql.query('SELECT  COUNT(*) id FROM  app_express')
  res.json({
    number: r.data[0].id + 1
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
 * 查询菜品分类数据
 */
router.get('/dishCategory', async function (req, res, next) {
  try {
    const result = await mysql.query('SELECT * FROM category LIMIT 200 OFFSET 0')
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

router.post('/addDishCategory', async function (req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    const result = await mysql.query(
      'INSERT INTO category (name) VALUES (?)',
      [name]
    );

    res.json({
      success: true,
      data: {
        id: result.data.insertId,
        name: name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加分类失败',
      error: error.message
    });
  }
});

// 更新分类
router.post('/updateCategory', async function(req, res, next) {
  try {
    const { id, name } = req.body;
    await mysql.query('UPDATE category SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error.message
    });
  }
});

// 删除分类
router.post('/deleteCategory', async function(req, res, next) {
  try {
    const { id } = req.body;
    await mysql.query('DELETE FROM category WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除分类失败',
      error: error.message
    });
  }
});




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
      sort = 'year,rating', // 修改默认排序为多字段
      order = 'desc,desc'   // 修改默认排序顺序
    } = req.query;

    if (pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: 'pageSize最大不能超过100'
      });
    }

    const offset = (page - 1) * pageSize;
    let baseSql = 'FROM media WHERE 1=1';
    const params = [];

    if (countries) {
      countries = decodeURIComponent(countries);
      baseSql += ' AND countries = ?';
      params.push(countries);
    }

    if (genres) {
      // 对genres参数进行解码处理
      const decodedGenres = decodeURIComponent(genres);
      baseSql += ' AND genres LIKE ?';
      params.push(`%${decodedGenres}%`);
    }


    if (category) {
      baseSql += ' AND category = ?';
      params.push(category);
    }

    const { yearSort, ratingSort } = req.query;

    const [countResult, result] = await Promise.all([
      mysql.query(`SELECT COUNT(*) as total ${baseSql}`, params),
      mysql.query(
        `SELECT id, title, thumbnail, year, rating,rating_count, countries, genres, category 
        ${baseSql} 
        ORDER BY year ${yearSort}, rating ${ratingSort}
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
        sort: {
          yearSort: yearSort || 'desc',
          ratingSort: ratingSort || 'desc'
        }
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

/**
 * 国家分布统计查询
 */
router.get('/mediaCountries', async function (req, res, next) {
  try {
    const result = await mysql.query(`
      SELECT 
        countries,
        COUNT(*) as count
      FROM media
      WHERE countries IS NOT NULL AND countries != ''
      GROUP BY countries
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('国家分布统计查询错误:', error);
    res.status(500).json({
      success: false,
      message: '查询国家分布统计失败',
      error: error.message
    });
  }
});

/**
 * 类型分布统计查询
 */
router.get('/mediaGenres', async function (req, res, next) {
  try {
    const result = await mysql.query(`
      SELECT DISTINCT g.genres
          FROM media g
          WHERE g.genres IS NOT NULL 
          AND g.genres != ""
          AND NOT EXISTS (
              SELECT 1 
              FROM media m
              WHERE m.genres IS NOT NULL
              AND m.genres != ""
              AND m.genres != g.genres
              AND (
                  g.genres LIKE CONCAT("%", m.genres, "%")
                  OR
                  m.genres LIKE CONCAT("%", g.genres, "%")
              )
              AND LENGTH(m.genres) < LENGTH(g.genres)
          ) ORDER BY g.genres;
    `);
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('类型分布统计查询错误:', error);
    res.status(500).json({
      success: false,
      message: '查询类型分布统计失败',
      error: error.message
    });
  }
})

/**
 * 分类统计查询
 */
router.get('/category', async function (req, res, next) {
  try {
    const result = await mysql.query(`
      SELECT
        category,
        COUNT(*) as count
      FROM media
      WHERE category IS NOT NULL AND category!= ''
      GROUP BY category
      ORDER BY count DESC
    `);
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('查询分类统计失败:', error);
    res.status(500).json({
      success: false,
      message: '查询分类统计失败',
      error: error.message
    });
  }
})


module.exports = router
