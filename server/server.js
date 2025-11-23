const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(cors());

// ----- Caminhos -----
const loginsPath = path.join(__dirname, "logins.json");
const chatsPath = path.join(__dirname, "chats.json");
const imagensPath = path.join(__dirname, "imagens");

// ----- Sistema de Upload -----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagensPath);
    },
    filename: (req, file, cb) => {
        const name = Date.now() + "-" + file.originalname;
        cb(null, name);
    },
});
const upload = multer({ storage });

// ----- Funções Util -----
function lerJSON(caminho) {
    return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

function salvarJSON(caminho, data) {
    fs.writeFileSync(caminho, JSON.stringify(data, null, 2));
}

// ----------------------------------
//  USUÁRIOS
// ----------------------------------

// Registrar
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    const users = lerJSON(loginsPath);

    if (users.find(u => u.username === username)) {
        return res.json({ ok: false, error: "User already exists" });
    }

    users.push({ username, password });

    salvarJSON(loginsPath, users);

    res.json({ ok: true });
});

// Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const users = lerJSON(loginsPath);

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user) return res.json({ ok: false });

    res.json({ ok: true });
});

// ----------------------------------
//  CHAT / POSTS
// ----------------------------------

// Buscar posts
app.get("/posts", (req, res) => {
    res.json(lerJSON(chatsPath));
});

// Criar post
app.post("/posts", upload.single("imagem"), (req, res) => {
    const { autor, texto, tipo } = req.body;
    const img = req.file ? req.file.filename : null;

    const posts = lerJSON(chatsPath);

    const novo = {
        id: Date.now(),
        autor,
        texto,
        tipo, // "arte", "meme", "cativeiro", etc.
        imagem: img,
        likes: 0,
        comentarios: []
    };

    posts.push(novo);

    salvarJSON(chatsPath, posts);

    res.json({ ok: true, post: novo });
});

// Dar like
app.post("/like", (req, res) => {
    const { postId } = req.body;

    const posts = lerJSON(chatsPath);
    const post = posts.find(p => p.id == postId);

    if (!post) return res.json({ ok: false });

    post.likes++;

    salvarJSON(chatsPath, posts);

    res.json({ ok: true });
});

// Comentar
app.post("/comment", (req, res) => {
    const { postId, autor, texto } = req.body;

    const posts = lerJSON(chatsPath);
    const post = posts.find(p => p.id == postId);

    if (!post) return res.json({ ok: false });

    post.comentarios.push({
        autor,
        texto,
        data: new Date().toISOString()
    });

    salvarJSON(chatsPath, posts);

    res.json({ ok: true });
});

// ----------------------------------
//  Servir imagens
// ----------------------------------
app.use("/imagens", express.static(imagensPath));

// ----------------------------------
//  Porta do Railway
// ----------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("API rodando na porta " + PORT);
});
