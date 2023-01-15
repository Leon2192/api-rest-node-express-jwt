const express = require("express");
const mysql = require("mysql");
const util = require("util");
const jwt = require("jsonwebtoken");
const { unless } = require("express-unless");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json()); // Todo lo que reciba verifica que sea json

// Conexion a la base de datos
const conexion = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "productos",
});
conexion.connect();
const query = util.promisify(conexion.query).bind(conexion); // Paso la conexion a promesa

// Autenticación
const auth = (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      throw new Error("No estás logueado.");
    }
    token = token.replace("Bearer ", "");

    jwt.verify(token, "Secret", (err, user) => {
      if (err) {
        throw new Error("Token inválido");
      }
    });
    next();
  } catch (e) {
    res.status(403).send({ message: e.message });
  }
};

auth.unless = unless;

app.use(
  auth.unless({
    path: [
      { url: "/login", methods: ["POST"] },
      { url: "/registro", methods: ["POST"] },
    ],
  })
);

app.post("/registro", async (req, res) => {
  try {
    if (!req.body.usuario || !req.body.clave || !req.body.email) {
      throw new Error("No enviaste los datos necesarios.");
    }

    const validacionUsuario = await query(
      "select * from usuarios where usuario=?",
      [req.body.usuario]
    );
    if (validacionUsuario.length > 0) {
      throw new Error("El usuario ya existe.");
    }

    // Verifico que no exista el nombre de usuario
    // entonces consulto a la db
    // select * from usuario where usuario = req.body.usuario
    // usuario.find({usuario: req.body.usuario})
    // si existe mando error

    // Si está todo bien, encripto la clave
    const claveEncriptada = await bcrypt.hash(req.body.clave, 10);

    // Guardar el usuario con la clave encriptada
    const usuario = {
      usuario: req.body.usuario,
      clave: claveEncriptada,
      email: req.body.email,
    };

    // Guardo el usuario

    await query(
      "insert into usuarios (usuario, clave, email) values(?, ?, ?)",
      [req.body.usuario, claveEncriptada, req.body.email]
    );

    res.send({ message: "Se registró correctamente." });
  } catch (e) {
    res.status(413).send({ message: e.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    if (!req.body.usuario || !req.body.clave) {
      throw new Error("No enviaste los datos necesarios.");
    }

    const usuario = await query("select * from usuarios where usuario=?", [
      req.body.usuario,
    ]);

    if (usuario.length == 0) {
      throw new Error("Usuario/password incorrecto.");
    }
    const claveCoincide = bcrypt.compareSync(req.body.clave, usuario[0].clave);

    if (!claveCoincide) {
      throw new Error("Usuario/password incorrecto.");
    }
    // Paso 1: Encuentro el usuario en la db
    // select * from usuario where usuario = req.body.usuario
    // usuario.find({usuario: req.body.usuario})
    // Si no lo encuentra, error
    // const claveEncriptada = "jhsagdhas"

    // Paso 2: Verificar la clave
    // if(!bcrypt.compareSync(req.body.clave, claveEncriptada)){
    //  throw new Error("Fallo el login")
    //}
    // Paso 3: Sesion
    const tokenData = {
      usuario: usuario[0].usuario,
      email: usuario[0].email,
      user_Id: usuario[0].id,
    };
    const token = jwt.sign(tokenData, "Secret", {
      expiresIn: 60 * 60 * 24, // 24 hs
    });

    res.send({ token });
  } catch (e) {
    res.status(413).send({ message: e.message });
  }
});

//

app.get("/api/productos", async (req, res) => {
  // Consulta a la db
  const respuesta = await query("select * from todos");
  // for (let i = 0; i < respuesta.length; i++) {
  // respuesta[1].numeroOrden = i + 1;
  //}
  //respuesta.forEach((elemento, index) => {
  //  elemento.numeroOrden = index;
  // });
  res.json(respuesta);
});

app.get("/api/productos/:id", async (req, res) => {
  try {
    const respuesta = await query("select * from todos where id=?", [
      req.params.id,
    ]);
    if (respuesta.length == 1) {
      res.json(respuesta[0]);
    } else {
      res.status(404).send();
    }
  } catch (e) {
    res.send("No tenemos ese juego.");
  }
});

// Inserto una nueva persona a la base de datos a través del formulario
app.post("/api/productos", async (req, res) => {
  try {
    const nombre = req.body.nombre;
    const imagen = req.body.photo_url;
    const genero = req.body.genero;
    const precio = req.body.precio;
    const respuesta = await query(
      "insert into todos (nombre, genero, photo_url, precio) values (?, ?, ?, ?)",
      [nombre, genero, imagen, precio]
    );
    const registroInsertado = await query("select * from todos where id=?", [
      respuesta.insertId,
    ]);
    res.json(registroInsertado[0]);
  } catch (e) {
    res.status(500).send("Error en la operación realizada.");
  }
});

app.put("/api/productos/:id", async (req, res) => {
  const nombre = req.body.nombre;
  const imagen = req.body.photo_url;
  const genero = req.body.genero;
  const precio = req.body.precio;
  const respuesta = await query(
    "update todos set nombre=?, genero=?, photo_url=?, precio=? where id=?", // Siempre que hacemos un update luego va where
    [nombre, genero, imagen, precio, req.params.id]
  );
  const registroInsertado = await query("select * from todos where id=?", [
    req.params.id,
  ]);
  res.json(registroInsertado[0]);
  // res.send(req.body); // Pruebo que llegue correctamente la info
});

app.delete("/api/productos/:id", async (req, res) => {
  const registro = await query("select * from todos where id=?", [
    req.params.id,
  ]);
  if (registro.length == 1) {
    await query("delete from todos where id=?", [req.params.id]);
    res.status(204).send();
  } else {
    res.status(404).send();
  }
});

app.listen(3000, () => {
  console.log("App corriendo en el puerto 3000");
});
