import express from "express";
import morgan from "morgan";

const PORT = 4000;

const app = express();

const home = (req, res) => res.send("home");
const login = (req, res) => {
  return res.send("login here");
};

app.use(morgan("tiny"));
app.get("/", home);
app.get("/login", login);

const handleListening = () =>
  console.log(`Server listening on port http://localhost:${PORT}`);

app.listen(PORT, handleListening);
