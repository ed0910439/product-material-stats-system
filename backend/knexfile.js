// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg', // 指定資料庫客戶端為 PostgreSQL
    connection: process.env.DATABASE_URL, // 從 .env 環境變數獲取資料庫連接字串
    migrations: {
      directory: './db/migrations' // 遷移檔案將存放在 db/migrations 目錄
    },
    seeds: {
      directory: './db/seeds' // 種子檔案將存放在 db/seeds 目錄 (用於填充測試數據，目前非必需)
    },
    pool: { // 連接池配置，可選，但建議保留
        min: 2,
        max: 10
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
