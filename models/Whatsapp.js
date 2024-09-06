import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Whatsapp = sequelize.define('Whatsapp', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      comment: 'Primary key for the Whatsapp table'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authDir: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastConnected: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '!'
    }
  });
  return Whatsapp;
};
