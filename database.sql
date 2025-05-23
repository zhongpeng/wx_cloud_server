/*==============================================================*/
/* DBMS name:      MySQL 8.0                                    */
/* Created on:     2023/12/15 14:30:00                          */
/* 注意：建议使用MySQL 8.0+版本运行本脚本                         */
/*==============================================================*/

use ktv;
-- ----------------------------
-- 门店基础信息表
-- ----------------------------
CREATE TABLE store_basic_info (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '门店自增主键ID',
    store_name VARCHAR(255) NOT NULL COMMENT '门店全称',
    branch_name VARCHAR(255) COMMENT '分店名称',
    city VARCHAR(50) NOT NULL COMMENT '所在城市',
    address VARCHAR(255) NOT NULL COMMENT '详细地址',
    longitude DECIMAL(10, 6) COMMENT '经度坐标',
    latitude DECIMAL(10, 6) COMMENT '纬度坐标',
    entrance_image VARCHAR(255) COMMENT '门店入口图URL',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB COMMENT='门店基础信息表';

-- ----------------------------
-- 门店联系信息表
-- ----------------------------
CREATE TABLE store_contact_info (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '联系信息自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店基础信息表的外键',
    phone_type VARCHAR(50) COMMENT '电话类型（如：座机、手机、客服热线）',
    area_code VARCHAR(10) COMMENT '区号（如：010、+86）',
    phone_number VARCHAR(20) NOT NULL COMMENT '电话号码',
    extension_number VARCHAR(20) COMMENT '分机号',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id)
) ENGINE=InnoDB COMMENT='门店联系信息表';

-- ----------------------------
-- 营业模式字典表
-- ----------------------------
CREATE TABLE business_mode_dict (
    id INTEGER PRIMARY KEY COMMENT '营业模式ID',
    name VARCHAR(20) NOT NULL COMMENT '营业模式名称',
    code VARCHAR(10) NOT NULL COMMENT '营业模式编码',
    sort_order INTEGER NOT NULL COMMENT '排序序号'
) ENGINE=InnoDB COMMENT='营业模式字典表';

-- 预填充营业模式数据
INSERT INTO business_mode_dict (id, name, code, sort_order) VALUES
(1, '全年营业', 'FULL_YEAR', 1),
(2, '按季度营业', 'SEASONAL', 2);

-- ----------------------------
-- 季节字典表
-- ----------------------------
CREATE TABLE season_dict (
    id INTEGER PRIMARY KEY COMMENT '季节ID',
    name VARCHAR(10) NOT NULL COMMENT '季节名称',
    code VARCHAR(125) NOT NULL COMMENT '季节编码',
    month_range VARCHAR(20) NOT NULL COMMENT '月份范围',
    sort_order INTEGER NOT NULL COMMENT '排序序号'
) ENGINE=InnoDB COMMENT='季节字典表';


-- 预填充季节数据
INSERT INTO season_dict (id, name, code, month_range, sort_order) VALUES
(1, '春季', 'SPRING', '3~5月', 1),
(2, '夏季', 'SUMMER', '6~8月', 2),
(3, '秋季', 'AUTUMN', '9~11月', 3),
(4, '冬季', 'WINTER', '12~2月', 4);

-- ----------------------------
-- 星期字典表
-- ----------------------------
CREATE TABLE weekday_dict (
    id INTEGER PRIMARY KEY COMMENT '星期ID',
    name VARCHAR(10) NOT NULL COMMENT '星期中文名',
    code VARCHAR(5) NOT NULL COMMENT '星期英文名缩写',
    sort_order INTEGER NOT NULL COMMENT '排序序号'
) ENGINE=InnoDB COMMENT='星期字典表';

-- 预填充数据
INSERT INTO weekday_dict (id, name, code, sort_order) VALUES
(1, '周一', 'Mon', 1),
(2, '周二', 'Tue', 2),
(3, '周三', 'Wed', 3),
(4, '周四', 'Thu', 4),
(5, '周五', 'Fri', 5),
(6, '周六', 'Sat', 6),
(7, '周日', 'Sun', 7);

-- ----------------------------
-- 门店营业信息表
-- ----------------------------
CREATE TABLE store_business_info (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '营业信息自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店基础信息表的外键',
    business_mode_id INTEGER NOT NULL COMMENT '营业模式ID（1=全年营业，2=按季度营业）',
    time_period_type VARCHAR(20) COMMENT '时段类型（24小时/自定义）',
    special_business_date VARCHAR(50) COMMENT '特殊营业日期范围（格式：YYYY-MM-DD~YYYY-MM-DD）',
    special_business_status VARCHAR(20) COMMENT '特殊营业状态（全天不营业/部分时间营业/全天营业）',
    special_business_time_ranges TEXT COMMENT '特殊营业时间段（格式：10:00-12:00,14:00-18:00）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id),
    FOREIGN KEY (business_mode_id) REFERENCES business_mode_dict(id),
    CONSTRAINT chk_business_mode CHECK (business_mode_id IN (1, 2))
) ENGINE=InnoDB COMMENT='门店营业信息表';

-- ----------------------------
-- 门店营业季节关联表
-- ----------------------------
CREATE TABLE store_business_seasons (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店ID',
    season_id INTEGER NOT NULL COMMENT '关联季节ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uniq_store_season (store_id, season_id),
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id),
    FOREIGN KEY (season_id) REFERENCES season_dict(id)
) ENGINE=InnoDB COMMENT='门店营业季节关联表';

-- ----------------------------
-- 营业时间配置表
-- ----------------------------
CREATE TABLE store_business_hours (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店ID',
    season_id INTEGER COMMENT '关联季节ID（仅按季度营业时有效）',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uniq_store_season_time (store_id, season_id, start_time, end_time),
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id),
    FOREIGN KEY (season_id) REFERENCES season_dict(id)
) ENGINE=InnoDB COMMENT='营业时间配置表';

-- ----------------------------
-- 门店营业日关联表
-- ----------------------------
CREATE TABLE store_business_weekdays (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店ID',
    weekday_id INTEGER NOT NULL COMMENT '关联星期ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uniq_store_weekday (store_id, weekday_id),
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id),
    FOREIGN KEY (weekday_id) REFERENCES weekday_dict(id)
) ENGINE=InnoDB COMMENT='门店营业日关联表';

-- ----------------------------
-- 媒体类型字典表
-- ----------------------------
CREATE TABLE media_type_dict (
    id INTEGER PRIMARY KEY COMMENT '媒体类型ID',
    name VARCHAR(20) NOT NULL COMMENT '媒体类型名称',
    code VARCHAR(10) NOT NULL COMMENT '媒体类型编码',
    file_extensions VARCHAR(100) COMMENT '允许的文件扩展名，逗号分隔',
    sort_order INTEGER NOT NULL COMMENT '排序序号'
) ENGINE=InnoDB COMMENT='媒体类型字典表';

-- 预填充媒体类型数据
INSERT INTO media_type_dict (id, name, code, file_extensions, sort_order) VALUES
(1, '图片', 'IMAGE', 'jpg,jpeg,png,gif,webp', 1),
(2, '视频', 'VIDEO', 'mp4,avi,mov,wmv,flv', 2);

-- ----------------------------
-- 门店相册表
-- ----------------------------
CREATE TABLE store_album (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '相册项自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店ID',
    media_type_id INTEGER NOT NULL COMMENT '媒体类型ID，关联media_type_dict',
    file_url VARCHAR(255) NOT NULL COMMENT '文件存储URL',
    thumbnail_url VARCHAR(255) COMMENT '缩略图URL（图片/视频专用）',
    file_name VARCHAR(100) COMMENT '原始文件名',
    file_size INTEGER COMMENT '文件大小（字节）',
    duration INTEGER COMMENT '视频时长（秒，图片为0）',
    description VARCHAR(255) COMMENT '媒体描述',
    is_cover INTEGER(1) DEFAULT 0 COMMENT '是否为封面（0=否，1=是）',
    sort_order INTEGER DEFAULT 0 COMMENT '显示排序，数值越小越靠前',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id),
    FOREIGN KEY (media_type_id) REFERENCES media_type_dict(id),
    INDEX idx_store_media (store_id, media_type_id)
) ENGINE=InnoDB COMMENT='门店相册表';

-- ----------------------------
-- 标签分类字典表
-- ----------------------------
CREATE TABLE tag_category_dict (
    id INTEGER PRIMARY KEY COMMENT '标签分类ID',
    name VARCHAR(50) NOT NULL COMMENT '标签分类名称',
    code VARCHAR(20) NOT NULL COMMENT '标签分类编码',
    sort_order INTEGER NOT NULL COMMENT '排序序号'
) ENGINE=InnoDB COMMENT='标签分类字典表';

-- 预填充标签分类数据
INSERT INTO tag_category_dict (id, name, code, sort_order) VALUES
(1, '停车信息', 'PARKING', 1),
(2, '网络服务', 'INTERNET', 2),
(3, '环境信息', 'ENVIRONMENT', 3),
(4, '门店设施', 'FACILITY', 4);

-- ----------------------------
-- 标签项字典表
-- ----------------------------
CREATE TABLE tag_item_dict (
    id integer PRIMARY KEY COMMENT '标签项ID',
    category_id INTEGER NOT NULL COMMENT '所属分类ID',
    name VARCHAR(50) NOT NULL COMMENT '标签项名称',
    code VARCHAR(20) NOT NULL COMMENT '标签项编码',
    sort_order INTEGER NOT NULL COMMENT '排序序号',
    FOREIGN KEY (category_id) REFERENCES tag_category_dict(id)
) ENGINE=InnoDB COMMENT='标签项字典表';


-- 预填充标签项数据
INSERT INTO tag_item_dict (id, category_id, name, code, sort_order) VALUES
-- 停车信息
(101, 1, '免费停车', 'FREE_PARKING', 1),
(102, 1, '付费停车', 'PAID_PARKING', 2),
(103, 1, '无停车位', 'NO_PARKING', 3),
-- 网络服务
(201, 2, '有WIFI', 'HAS_WIFI', 1),
(202, 2, '无WIFI', 'NO_WIFI', 2),
-- 环境信息
(301, 3, '有吸烟区', 'HAS_SMOKING_AREA', 1),
(302, 3, '无吸烟区', 'NO_SMOKING_AREA', 2),
(303, 3, '有包厢', 'HAS_PRIVATE_ROOM', 3),
(304, 3, '有卡座', 'HAS_BOOST', 4),
(305, 3, '有沙发座', 'HAS_SOFA', 5),
(306, 3, '有充电线', 'HAS_CHARGER', 6),
-- 门店设施
(401, 4, '立麦', 'STANDING_MIC', 1),
(402, 4, '四面屏', 'FOUR_SCREENS', 2),
(403, 4, '投影', 'PROJECTION', 3),
(404, 4, '独立卫生间', 'PRIVATE_BATHROOM', 4),
(405, 4, '高档音响', 'HIGH_END_SOUND', 5);

-- ----------------------------
-- 门店标签关联表
-- ----------------------------
CREATE TABLE store_tags (
    id INTEGER AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    store_id INTEGER NOT NULL COMMENT '关联门店ID',
    tag_id INTEGER NOT NULL COMMENT '关联标签项ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uniq_store_tag (store_id, tag_id),
    FOREIGN KEY (store_id) REFERENCES store_basic_info(id),
    FOREIGN KEY (tag_id) REFERENCES tag_item_dict(id)
) ENGINE=InnoDB COMMENT='门店标签关联表';



-- ----------------------------
-- 插入门店基础信息
-- ----------------------------
INSERT INTO store_basic_info (store_name, branch_name, city, address, longitude, latitude, entrance_image)
VALUES (
    '小萨KTV', 
    '武侯店', 
    '成都市', 
    '武侯区武侯祠大街123号', 
    104.0657, 
    30.5464, 
    'https://picsum.photos/600/400?random=1'
);

SET @store_id = LAST_INSERT_ID(); -- 获取刚插入的门店ID

-- ----------------------------
-- 插入门店联系信息
-- ----------------------------
INSERT INTO store_contact_info (store_id, phone_type, area_code, phone_number)
VALUES (
    @store_id, 
    '客服电话', 
    '028', 
    '85556666'
);

-- ----------------------------
-- 插入门店营业信息（全年营业）
-- ----------------------------
INSERT INTO store_business_info (store_id, business_mode_id, time_period_type)
VALUES (
    @store_id, 
    1, -- 全年营业
    '自定义'
);

-- ----------------------------
-- 插入营业时间（全年营业）
-- ----------------------------
INSERT INTO store_business_hours (store_id, start_time, end_time)
VALUES (
    @store_id, 
    '12:00:00', 
    '03:30:00' -- 次日凌晨3:30
);

-- ----------------------------
-- 插入门店相册（随机3张图片）
-- ----------------------------
INSERT INTO store_album (store_id, media_type_id, file_url, thumbnail_url, file_name, is_cover)
VALUES 
(
    @store_id, 
    1, -- 图片
    'https://picsum.photos/800/600?random=10', 
    'https://picsum.photos/200/150?random=10', 
    '门店外观.jpg', 
    1 -- 设为封面
),
(
    @store_id, 
    1, 
    'https://picsum.photos/800/600?random=11', 
    'https://picsum.photos/200/150?random=11', 
    'KTV包间.jpg', 
    0
),
(
    @store_id, 
    1, 
    'https://picsum.photos/800/600?random=12', 
    'https://picsum.photos/200/150?random=12', 
    '前台接待.jpg', 
    0
);

-- ----------------------------
-- 插入门店标签
-- ----------------------------
INSERT INTO store_tags (store_id, tag_id)
VALUES 
(@store_id, 101), -- 免费停车
(@store_id, 201), -- 有WIFI
(@store_id, 301), -- 有吸烟区
(@store_id, 303), -- 有包厢
(@store_id, 305), -- 有沙发座
(@store_id, 306), -- 有充电线
(@store_id, 402), -- 四面屏
(@store_id, 404), -- 独立卫生间
(@store_id, 405); -- 高档音响


