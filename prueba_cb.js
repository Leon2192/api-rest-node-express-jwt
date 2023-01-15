function next() {
  console.log("Llamo a next");
}

function f02(parametros) {
  console.log("Funcion 02");
  parametros();
}

f02(next);
