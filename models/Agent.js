import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Agent = sequelize.define('Agent', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    model_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uid: {
      type: DataTypes.STRING,
      unique: true
    },
    system_instruction: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    temperature: {
      type: DataTypes.FLOAT,
      defaultValue: 0.9
    },
    top_k: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    top_p: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0
    },
    max_output_tokens: {
      type: DataTypes.INTEGER,
      defaultValue: 2000
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'enabled'
    }
  });

  return Agent;
};
