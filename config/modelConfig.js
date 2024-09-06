import { DataTypes } from 'sequelize';
import sequelize from './database.js';

const defaultOptions = {
  sequelize,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

export { defaultOptions };
