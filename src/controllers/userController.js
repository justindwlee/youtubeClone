import User from "../models/User";
import Video from "../models/Video";
import bcrypt from "bcrypt";
import convertS3UrlToCloudFrontUrl from "../utils/s3ToCloudFront";
import { deleteS3File } from "../middlewares";

export const getJoin = (req, res) =>
  res.render("users/join", { pageTitle: "Join Here" });

export const postJoin = async (req, res) => {
  const { name, email, username, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: "Passwords does not match.",
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    req.flash("error", "This username/email is already taken.");
    return res.status(400).render("users/join", {
      pageTitle,
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
    req.flash("success", "Account");

    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: error._message,
    });
  }
};

export const getLogin = (req, res) =>
  res.render("users/login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    req.flash("error", "The account does not exist.");
    return res.status(400).render("users/login", {
      pageTitle,
    });
  }
  //check if the password input is correct by comparing hashes
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    req.flash("error", "Password does not match.");
    return res.status(400).render("users/login", {
      pageTitle,
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  req.flash("success", `Welcome ${user.username}!`);
  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        name: userData.name,
        email: emailObj.email,
        username: userData.login,
        password: "",
        location: userData.location,
        socialOnly: true,
        avatarUrl: userData.avatar_url,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res) => {
  req.session.user = undefined;
  req.session.loggedIn = false;
  // req.session.destroy();
  req.flash("info", "Bye bye!🖐️");
  return res.redirect("/");
};

export const getEdit = (req, res) => {
  return res.render("users/edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, email: sessionEmail, username: sessionUsername, avatarUrl },
    },
    body: { email, name, username, location },
    file,
  } = req;

  const pageTitle = "Edit Profile";
  // if the user is trying to update username or email, check if it is already taken
  if (sessionEmail !== email) {
    const emailExists = await User.exists({ email });
    if (emailExists) {
      req.flash("error", "This email is already taken.");
      return res.status(400).render("users/edit-profile", {
        pageTitle,
      });
    }
  }
  if (sessionUsername !== username) {
    const usernameExists = await User.exists({ username });
    if (usernameExists) {
      req.flash("error", "This username is already taken.");
      return res.status(400).render("users/edit-profile", {
        pageTitle,
      });
    }
  }
  if (file) {
    await deleteS3File(
      decodeURIComponent(avatarUrl.split(".cloudfront.net/").pop())
    );
  }
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? convertS3UrlToCloudFrontUrl(file.location) : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = updatedUser;
  req.flash("success", "Update Successful!");
  return res.redirect(`/users/${_id}`);
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Cannot change password");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const pageTitle = "Change Password";
  const {
    session: {
      user: { _id, password },
    },
    body: { oldPassword, newPassword, newPassword2 },
  } = req;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    req.flash("error", "The current password is incorrect.");
    return res.status(400).render("users/change-password", {
      pageTitle,
    });
  }
  if (newPassword !== newPassword2) {
    req.flash("error", "The new password does not match the confirmation.");
    return res.status(400).render("users/change-password", {
      pageTitle,
    });
  }
  user.password = newPassword;
  await user.save();
  req.flash("info", "Password updated ");
  return res.redirect("/users/logout");
};

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("videos");
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }
  res.render("users/profile", {
    pageTitle: `${user.username} Profile`,
    user,
  });
};
