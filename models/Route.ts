// models/Route.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IRoute } from '@/types';

const routeSchema = new Schema<IRoute>(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    comeSoon: {
      type: Boolean,
      default: false,
    },
    fromLocation: {
      type: String,
      required: [true, 'From location is required'],
      trim: true,
    },
    toLocation: {
      type: String,
      required: [true, 'To location is required'],
      trim: true,
    },
    pickupLocations: [
      {
        type: String,
        trim: true,
      },
    ],
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [0, 'Distance cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'routes',
  }
);

const Route = models.Route || model<IRoute>('Route', routeSchema);

export default Route;