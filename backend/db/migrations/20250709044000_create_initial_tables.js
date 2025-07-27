// backend/db/migrations/YOUR_TIMESTAMP_create_initial_tables.js

exports.up = function(knex) {
  return knex.schema
    .createTable('meals', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 255).notNullable().unique();
      table.enum('menu_category', ['牛區', '風味區', '炒飯區', '涼滷飲品區', 'ALL']).notNullable();
      table.enum('menu_classification', [
        '紅燒牛', '辣味牛', '原味牛', '燉蕃茄牛', '湯品-牛',
        '湯品-風', '乾拌麵', '風味麵', '私房小食', '炒飯',
        '滷水', '涼拌小菜', '飲品', '其他', '組合單品',
        'UberEats', '享優惠', '經典餐', '組合套餐'
      ]).notNullable();
      table.enum('meal_type', ['餐點', '附加選項用', '包材']).notNullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true); // creates created_at and updated_at columns
    })
    .createTable('half_products', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 255).notNullable().unique();
      table.enum('category', ['牛區', '風味區', '炒飯區', '涼滷飲品區', '需再加工區']).notNullable();
      table.enum('classification', ['可直接販售', '不可直接販售']).notNullable();
      table.decimal('unit_quantity', 10, 3).notNullable(); // 總位數10，小數3位
      table.enum('unit', ['克', '公斤', '份', '公升', '個', '片', '條', '包', '箱']).notNullable();
      table.enum('supplier', [
        '央廚', '全台', '忠欣', '美食家', '晟莊',
        '富育', '開元', '順田', '裕賀', '農夫(森鮮)', '點線麵'
      ]).notNullable();
      table.timestamps(true, true);
    })
    .createTable('meal_recipes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('meal_id').notNullable().references('id').inTable('meals').onDelete('CASCADE');
      table.uuid('half_product_id').notNullable().references('id').inTable('half_products').onDelete('CASCADE');
      table.decimal('required_quantity', 10, 3).notNullable(); // 總位數10，小數3位
      table.enum('unit', ['克', '公斤', '份', '公升', '個', '片', '條', '包', '箱']).notNullable(); // 注意：這裡的單位是配方單位，不是半成品進貨單位
      table.timestamps(true, true);
      table.unique(['meal_id', 'half_product_id']); // 複合唯一索引
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('meal_recipes')
    .dropTableIfExists('half_products')
    .dropTableIfExists('meals');
};