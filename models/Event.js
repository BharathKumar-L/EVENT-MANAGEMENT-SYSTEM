const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  owner: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  organizedBy: { type: String, required: true },
  eventDate: { type: Date, required: true, index: true },
  eventTime: { type: String, required: true },
  location: { type: String, required: true },
  Participants: { type: Number, default: 0 },
  Count: { type: Number, default: 0 },
  Income: { type: Number, default: 0 },
  ticketPrice: { type: Number, required: true, min: 0 },
  Quantity: { type: Number, default: 0 },
  image: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  Comment: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);


