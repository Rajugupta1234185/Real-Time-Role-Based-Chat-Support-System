import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: false, unique: true, default: null },
  user: { type: String, required: true },
  agent: { type: String, required: true },
  messages: {
    type: [messageSchema],
    default: [], // empty array initially (preferred over null)
  },
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
