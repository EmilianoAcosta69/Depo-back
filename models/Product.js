const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  talle: { type: String, required: true },
  cantidadBultos: { type: Number, required: true },
  observaciones: String,
  createdAt: { type: Date, default: Date.now }
},
{ timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
