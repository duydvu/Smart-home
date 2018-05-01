const sequelize=require("sequelize")

const db=new sequelize({
    database:"demoDb",
    username:"postgres",
    password:"chuyentien1307",
    host:"localhost",
    port:5432,
    dialect: "postgres",
    define:{
        freezeTableName: true
    }
})

db.authenticate()
.then(()=>console.log("ket noi thanh cong"))
.catch(err=>console.log(err.message))

const Users=db.define("Data",{
    username:sequelize.STRING,
    password: sequelize.STRING,
    room: sequelize.STRING,
    idRoom: sequelize.INTEGER,
    device: sequelize.STRING,
    idDevice:sequelize.INTEGER,
    statusDevice:sequelize.BOOLEAN,
})

db.sync()
.then(()=>console.log("tao model"))


module.exports=Users