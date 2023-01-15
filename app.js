const express = require("express");
const mysql = require("mysql");

const app = express();

// Conexion a la base de datos
const conexion = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "diplomatura",
});

conexion.connect();

app.get("/", (req, res) => {
  // Consulta a la db
  conexion.query("select * from persona", (error, resultados) => {
    console.log(resultados);
    res.send("Ok");
    /* let html = "<ul>";
    resultados.map((person) => {
      html += `<li>${person.nombre}</li>`;
    });

    html += "</ul>"
    res.send(html);*/
  });
});

app.listen(3000, () => {
  console.log("App corriendo en el puerto 3000");
});
