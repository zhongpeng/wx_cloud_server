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

/**
 * 查询门店基础信息（默认门店）
 */
router.get('/store', async function (req, res, next) {
  try {
    const DEFAULT_STORE_ID = 1;

    // 1. 查询门店基础信息和联系方式
    const storeResult = await mysql.query(`
      SELECT 
        sb.*,
        sc.phone_type,
        sc.phone_number,
        sc.area_code,
        sc.extension_number,
        sm.business_mode_id,
        bmd.name AS business_mode_name,
        sm.time_period_type
      FROM 
        store_basic_info sb
      LEFT JOIN 
        store_contact_info sc ON sb.id = sc.store_id
      LEFT JOIN 
        store_business_info sm ON sb.id = sm.store_id
      LEFT JOIN 
        business_mode_dict bmd ON sm.business_mode_id = bmd.id
      WHERE 
        sb.id = ?
    `, [DEFAULT_STORE_ID]);

    if (!storeResult || !storeResult.data || !storeResult.data.length) {
      return res.status(404).json({
        success: false,
        message: '默认门店不存在'
      });
    }

    const store = storeResult.data[0];

    // 2. 查询门店营业时间
    const hoursResult = await mysql.query(`
      SELECT 
        sbh.season_id,
        sd.name AS season_name,
        sbh.start_time,
        sbh.end_time
      FROM 
        store_business_hours sbh
      LEFT JOIN 
        season_dict sd ON sbh.season_id = sd.id
      WHERE 
        sbh.store_id = ?
    `, [DEFAULT_STORE_ID]);

    store.businessHours = hoursResult.data || [];

    // 3. 查询门店营业日
    const weekdaysResult = await mysql.query(`
      SELECT 
        wd.id AS weekday_id,
        wd.name AS weekday_name
      FROM 
        store_business_weekdays sbw
      JOIN 
        weekday_dict wd ON sbw.weekday_id = wd.id
      WHERE 
        sbw.store_id = ?
    `, [DEFAULT_STORE_ID]);

    store.businessWeekdays = weekdaysResult.data || [];

    res.json({
      success: true,
      data: store
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
 * 查询门店相册（默认门店）
 */
router.get('/store/album', async function (req, res, next) {
  try {
    const DEFAULT_STORE_ID = 1;

    const albumResult = await mysql.query(`
      SELECT 
        sa.*,
        mt.name AS media_type_name
      FROM 
        store_album sa
      JOIN 
        media_type_dict mt ON sa.media_type_id = mt.id
      WHERE 
        sa.store_id = ?
      ORDER BY 
        sa.sort_order ASC,
        sa.create_time DESC
    `, [DEFAULT_STORE_ID]);

    res.json({
      success: true,
      data: albumResult.data || []
    });
  } catch (error) {
    console.error('查询门店相册失败:', error);
    res.status(500).json({
      success: false,
      message: '查询门店相册失败',
      error: error.message
    });
  }
});

/**
 * 查询门店标签（默认门店）
 */
router.get('/store/tags', async function (req, res, next) {
  try {
    const DEFAULT_STORE_ID = 1;

    const tagsResult = await mysql.query(`
      SELECT 
        tid.id AS tag_id,
        tid.name AS tag_name,
        tcd.name AS tag_category
      FROM 
        store_tags st
      JOIN 
        tag_item_dict tid ON st.tag_id = tid.id
      JOIN 
        tag_category_dict tcd ON tid.category_id = tcd.id
      WHERE 
        st.store_id = ?
    `, [DEFAULT_STORE_ID]);

    res.json({
      success: true,
      data: tagsResult.data || []
    });
  } catch (error) {
    console.error('查询门店标签失败:', error);
    res.status(500).json({
      success: false,
      message: '查询门店标签失败',
      error: error.message
    });
  }
});

/**
 * 查询套餐列表
 */
router.get('/package', async function (req, res, next) {
  try {
    const tagsResult = await mysql.query(`SELECT * FROM package LIMIT 50 OFFSET 0`);
    res.json({
      success: true,
      data: tagsResult.data || []
    });
  } catch (error) {
    console.error('查询套餐列表失败:', error);
    res.status(500).json({
      success: false,
      message: '查询套餐列表失败',
      error: error.message
    });
  }
});

/**
 * 新增套餐
 */
router.post('/package/add', async function (req, res, next) {
  try {
    const { name, description, is_active } = req.body;

    if (name === undefined || description === undefined || is_active === undefined) {
      return res.status(400).json({ success: false, message: '缺少必要参数: name, description, is_active' });
    }
    
    if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
        return res.status(400).json({ success: false, message: 'is_active 必须是布尔值或 0/1' });
    }

    const result = await mysql.query(
      'INSERT INTO package (name, description, is_active, create_time, update_time) VALUES (?, ?, ?, NOW(), NOW())',
      [name, description, is_active]
    );

    if (result.data && result.data.affectedRows > 0) {
      res.status(201).json({ 
        success: true, 
        message: '新增套餐成功',
        id: result.data.insertId 
      });
    } else {
      res.status(500).json({ success: false, message: '新增套餐失败' });
    }
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
 * 更新套餐信息
 */
router.put('/package/update/:id', async function (req, res, next) {
  try {
    const packageId = req.params.id;
    const { name, description, is_active } = req.body;

    if (name === undefined && description === undefined && is_active === undefined) {
      return res.status(400).json({ success: false, message: '至少需要一个更新字段: name, description, or is_active' });
    }

    let setClauses = [];
    let params = [];

    if (name !== undefined) {
      setClauses.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      setClauses.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
        return res.status(400).json({ success: false, message: 'is_active 必须是布尔值或 0/1' });
      }
      setClauses.push('is_active = ?');
      params.push(is_active);
    }

    if (setClauses.length === 0) {
         return res.status(400).json({ success: false, message: '没有提供有效的更新字段' });
    }

    setClauses.push('update_time = NOW()');
    params.push(packageId);

    const query = `UPDATE package SET ${setClauses.join(', ')} WHERE id = ?`;
    const result = await mysql.query(query, params);

    if (result.data && result.data.affectedRows > 0) {
      res.json({ success: true, message: '更新套餐成功' });
    } else if (result.data && result.data.affectedRows === 0) {
      res.status(404).json({ success: false, message: '未找到对应套餐或数据未改变' });
    } else {
      res.status(500).json({ success: false, message: '更新套餐失败' });
    }
  } catch (error) {
    console.error('更新套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '更新套餐失败',
      error: error.message
    });
  }
});

/**
 * 删除套餐
 */
router.delete('/package/del/:id', async function (req, res, next) {
  try {
    const packageId = req.params.id;

    const result = await mysql.query('DELETE FROM package WHERE id = ?', [packageId]);

    if (result.data && result.data.affectedRows > 0) {
      res.json({ success: true, message: '删除套餐成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到对应套餐或删除失败' });
    }
  } catch (error) {
    console.error('删除套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '删除套餐失败',
      error: error.message
    });
  }
});

module.exports = router
