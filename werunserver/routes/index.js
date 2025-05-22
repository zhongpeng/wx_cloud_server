const express = require('express')
const mysql = require('../work/mysql')
const router = express.Router()

// 添加全局中间件设置CORS头
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})


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
router.post('/updateCategory', async function (req, res, next) {
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
router.post('/deleteCategory', async function (req, res, next) {
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


/*****************************************   KTV ****************************************/
/**
 * 获取门店详细信息
 */
router.get('/storeInfo', async function (req, res, next) {
  try {
    const result = await mysql.query(`
      SELECT 
        s.store_id, 
        s.name,
        s.phone, 
        s.address, 
        CASE s.status 
            WHEN '暂停营业' THEN 
                CONCAT('暂停营业（原因：', COALESCE(s.suspension_reason, '无'), 
                       ' 时段：', s.suspension_start, '至', 
                       COALESCE(s.suspension_end, '未确定'), ')') 
            WHEN '即将开业' THEN 
                CONCAT('即将开业（预计开业时间：', s.open_date, ')') 
            ELSE '正常营业' 
        END, 
        ( 
            SELECT 
                JSON_ARRAYAGG( 
                    JSON_OBJECT( 
                        '营业类型', IF(bs.schedule_type = '全年', '全年营业', CONCAT(bs.season, '营业')), 
                        '营业日', od.days_of_week, 
                        '时间段', ( 
                            SELECT 
                                JSON_ARRAYAGG( 
                                    IF(bts.is_24h, 
                                        '24小时营业', 
                                        CONCAT(TIME_FORMAT(bts.start_time, '%H:%i'), '-', 
                                               TIME_FORMAT(bts.end_time, '%H:%i')) 
                                    ) 
                                ) 
                            FROM BusinessTimeSlot bts 
                            WHERE bts.schedule_id = bs.schedule_id 
                        ) 
                    ) 
                ) 
            FROM BusinessSchedule bs 
            JOIN OperatingDays od ON bs.schedule_id = od.schedule_id 
            WHERE bs.store_id = s.store_id 
        ), 
        ( 
            SELECT 
                JSON_ARRAYAGG( 
                JSON_OBJECT( 
                    '日期范围', CONCAT(ss.start_date, ' 至 ', ss.end_date), 
                    '营业状态', ss.status, 
                    '时间段', ( 
                        SELECT 
                            CASE 
                                WHEN ss.status = '全天不营业' THEN JSON_ARRAY('不营业') 
                                WHEN ss.status = '全天营业' THEN JSON_ARRAY('24小时营业') 
                                ELSE ( 
                                    SELECT JSON_ARRAYAGG( 
                                        CONCAT(TIME_FORMAT(sts.start_time, '%H:%i'), '-', 
                                               TIME_FORMAT(sts.end_time, '%H:%i')) 
                                    ) 
                                    FROM SpecialTimeSlot sts 
                                    WHERE sts.special_id = ss.special_id 
                                ) 
                            END 
                    ) 
                ) 
            ) 
            FROM SpecialSchedule ss 
            WHERE ss.store_id = s.store_id 
        )
      FROM Store s 
      LIMIT 1
    `);

    res.json({
      success: true,
      data: result.data[0] || null
    });
  } catch (error) {
    console.error('查询门店信息失败:', error);
    res.status(500).json({
      success: false,
      message: '查询门店信息失败',
      error: error.message
    });
  }
});



/**
 * 查询套餐数据
 */
router.get('/packages', async function (req, res, next) {
  try {
    const result = await mysql.query(`
      SELECT 
        package_id,
        name,
        status,
        description,
        is_active
      FROM Package
      ORDER BY package_id
    `);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('查询套餐数据失败:', error);
    res.status(500).json({
      success: false,
      message: '查询套餐数据失败',
      error: error.message
    });
  }
});

/**
 * 新增套餐
 */
router.post('/addPackage', async function (req, res, next) {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '套餐名称不能为空'
      });
    }

    const result = await mysql.query(
      'INSERT INTO Package (name, description) VALUES (?, ?)',
      [name, description]
    );

    res.json({
      success: true,
      data: {
        package_id: result.data.insertId,
        name,
        description
      }
    });
  } catch (error) {
    console.error('新增套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '新增套餐失败',
      error: error.message
    });
  }
});

/**
 * 删除套餐
 */
router.delete('/deletePackage/:id', async function (req, res, next) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '套餐ID不能为空'
      });
    }
    const result = await mysql.query(
      'DELETE FROM Package WHERE package_id = ?',
      [id]
    );
    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到指定套餐'
      });
    }
    res.json({
      success: true,
      message: '套餐删除成功'
    });
  } catch (error) {
    console.error('删除套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '删除套餐失败',
      error: error.message
    });
  }
});

/**
 * 编辑套餐
 */
router.put('/updatePackage/:id', async function (req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, status, is_active } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '套餐ID不能为空'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '套餐名称不能为空'
      });
    }

    const result = await mysql.query(
      'UPDATE Package SET name = ?, description = ?, status = ?, is_active = ? WHERE package_id = ?',
      [name, description, status, is_active, id]
    );

    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到指定套餐'
      });
    }

    res.json({
      success: true,
      message: '套餐更新成功',
      data: {
        package_id: id,
        name,
        description,
        status,
        is_active
      }
    });
  } catch (error) {
    console.error('更新套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '更新套餐失败',
      error: error.message
    });
  }
});



module.exports = router
