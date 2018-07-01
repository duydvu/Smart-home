const Sequelize = require('sequelize');
const sequelize = new Sequelize('d1du91a3np5las', 'ycscfgfdxqmeyq', '979d555388a312ae8b02e153c842e3142f98316b2d3304257ae70ee9a6c40905', {
    host: 'ec2-107-21-95-70.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    
    dialectOptions: {
        ssl: true
    },

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
  
    operatorsAliases: false
});

const User = sequelize.define('user', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    password: Sequelize.STRING,
    rule: Sequelize.STRING,
});

const Device = sequelize.define('device', {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    name: Sequelize.STRING,
    status: Sequelize.BOOLEAN,
    user_id: {
        type: Sequelize.STRING,
        references: {
            // This is a reference to another model
            model: User,
            // This is the column name of the referenced model
            key: 'username',
            // This declares when to check the foreign key constraint. PostgreSQL only.
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    }
})