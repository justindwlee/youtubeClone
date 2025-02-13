import User from "../models/User";
import bcrypt from "bcrypt";

export const getJoin = (req, res) =>
  res.render("join", { pageTitle: "Join Here" });

export const postJoin = async (req, res) => {
  const { name, email, username, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Passwords does not match.",
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This username/email is already taken.",
    });
  }
  try {
    await User.create({
      name,
      email,
      username,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: error._message,
    });
  }
};

export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "The account does not exist.",
    });
  }
  //check if the password input is correct by comparing hashes
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "Password does not match.",
    });
  }
  res.redirect("/");
};

export const edit = (req, res) => res.send("Edit Users");
export const remove = (req, res) => res.send("Remove Users");
export const see = (req, res) => res.send("See user profile");
export const logout = (req, res) => res.send("Logout");
