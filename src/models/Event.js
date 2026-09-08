import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    fecha: { type: Date },
    categoria: { type: String },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
