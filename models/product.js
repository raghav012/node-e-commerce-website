const Sequelize = require('sequelize');

const sequelize = require('../util/database');

// product is the name given to table we want to create nomally lower case and the in {it include the datatype defining} 
const Product = sequelize.define('product', {
  id: {
     //format to define a dtatype in id
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  title: Sequelize.STRING,
  price: {
    type: Sequelize.DOUBLE,
    allowNull: false
  },
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = Product;
