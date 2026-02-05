import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: String,
  state: String,
  country: {
    type: String,
    default: 'France',
  },
  postalCode: String,
  latitude: Number,
  longitude: Number,
  timezone: {
    type: String,
    default: 'Europe/Paris',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Location = mongoose.model('Location', locationSchema);
export default Location;








