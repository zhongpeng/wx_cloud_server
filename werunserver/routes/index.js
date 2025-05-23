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
 * 查询门店信息（默认门店）
 */
router.get('/store', async function (req, res, next) {
  try {
    // 假设默认门店ID为1，可根据实际情况修改
    const DEFAULT_STORE_ID = 1;
    
    // 1. 查询门店基础信息
    const [storeResult] = await mysql.query(`
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
    
    if (!storeResult || !storeResult.data.length) {
      return res.status(404).json({
        success: false,
        message: '默认门店不存在'
      });
    }
    
    const store = storeResult.data[0];
    
    // 2. 查询门店营业时间
    const [hoursResult] = await mysql.query(`
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
    
    store.businessHours = hoursResult.data;
    
    // 3. 查询门店营业日
    const [weekdaysResult] = await mysql.query(`
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
    
    store.businessWeekdays = weekdaysResult.data;
    
    // 4. 查询门店相册
    const [albumResult] = await mysql.query(`
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
    
    store.album = albumResult.data;
    
    // 5. 查询门店标签
    const [tagsResult] = await mysql.query(`
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
    
    store.tags = tagsResult.data;
    
    // 返回完整的门店信息
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



module.exports = router
