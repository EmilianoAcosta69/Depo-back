require("dotenv").config();

console.log("MONGO_URI:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const Product = require("./models/Product")
const User = require("./models/User");

const app = express();
const JWT_SECRET = "deposito_secreto_123";


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo conectado"))
    .catch(err => console.error("Mongo error:", err));

app.use(cors({
    origin: "*"
}));

app.use(express.json());
require("dotenv").config();

app.get("/test", (req, res) => {
    res.json({ ok: true });
});

app.get("/", (req, res) => {
    res.json({ ok: true, message: "API funcionando" });
});

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Token inválido" });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Permisos insuficientes" });
    }
    next();
};


app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    console.log("LOGIN BODY:", username, password);
    console.log("DB NAME:", mongoose.connection.name);

    const user = await User.findOne({ username });


    console.log("USER FOUND:", user);
    if (!user) {
        return res.status(401).json({ error: "Usuario inválido" });
    }

    if (user.password !== password) {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: "8h" }
    );

    res.json({
        token,
        user: {
            username: user.username,
            role: user.role
        }
    });
});



app.get("/products", async (req, res) => {
    const { marca, modelo, talle } = req.query;

    const filtro = {};

    if (marca) {
        filtro.marca = new RegExp(marca, "i"); // insensible a mayúsculas
    }

    if (modelo) {
        filtro.modelo = new RegExp(modelo, "i");
    }

    if (talle) {
        filtro.talle = talle;
    }

    const products = await Product.find(filtro).sort({ createdAt: -1 });

    res.json(products);
});

app.get("/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json(product);
    } catch (error) {
        res.status(400).json({ error: "ID inválido" });
    }
});

app.delete("/products/:id", authMiddleware, async (req, res) => {
    try {
        // opcional: validación por rol
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "No autorizado" });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        res.status(400).json({ error: "ID inválido" });
    }
});


app.post("/products", authMiddleware, async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put("/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get("/create-admin", async (req, res) => {
    const user = await User.create({
        username: "admin",
        password: "1234",
        role: "admin"
    });

    res.json(user);
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log("Backend OK en puerto", PORT);
});
