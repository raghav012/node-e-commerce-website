const Sequelize =require('sequelize');
const sequelize=new Sequelize('raghav','root','Raghav@12345!',{
    dialect:'mysql',
    host:'localhost'
});

module.exports=sequelize;