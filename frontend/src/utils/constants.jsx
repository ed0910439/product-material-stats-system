// frontend/src/utils/constants.js

export const MEAL_CATEGORIES = ['牛區', '風味區', '炒飯區', '涼滷飲品區'];
export const MEAL_TYPES = ['餐點', '附加選項用', '包材'];
export const HALF_PRODUCT_CATEGORIES = ['牛區', '風味區', '菜滷飲', '需再加工區', '其他'];
export const HALF_PRODUCT_CLASSIFICATIONS = ['可直接販售', '不可直接販售'];
export const SUPPLIERS = ['央廚', '全台', '忠欣', '美食家', '晟莊', '富育', '開元', '順田', '裕賀', '農夫(森鮮)', '點線麵'];

export const MEAL_CATEGORY_CLASSIFICATION_MAP = {
    '牛區': ['紅燒牛肉麵', '辣味牛肉麵', '原味牛肉麵', '燉蕃茄牛肉麵', '湯品-牛'],
    '風味區': ['湯品-風', '乾拌麵', '風味麵', '私房小食'],
    '炒飯區': ['炒飯'],
    '涼滷飲品區': ['滷水', '涼拌小菜', '飲品'],
    'ALL': ['其他', '組合單品', 'UberEats', '享優惠', '經典餐', '組合套餐'], // 'ALL' 類別應該包含所有非特定分類的餐點
};

export const HALF_PRODUCT_PACKAGING_UNITS = ['公斤', '公克', '公升', '毫升', '球', '粒', '顆', '個', '支', '片', '瓶', '罐', '桶', '份', '包', '袋', '箱'];
export const HALF_PRODUCT_CAPACITY_UNITS = ['公斤', '公克', '公升', '毫升', '球', '粒', '顆', '個', '支', '片', '瓶', '罐', '桶', '份', '包', '袋', '箱'];
export const COMMON_UNITS = ['公斤', '公克', '公升', '毫升', '球', '粒', '顆', '個', '支', '片', '瓶', '罐', '桶', '份', '包', '袋', '箱'];
export const COMPONENT_TYPES = [
    { label: '原物料', value: 'RAW_MATERIAL' },
    { label: '半成品', value: 'HALF_PRODUCT' },
];