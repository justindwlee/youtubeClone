import multer from "multer";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const s3Client = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const s3AvatarStorage = multerS3({
  s3: s3Client,
  bucket: "youtubeclone-delicate-smoke-9951",
  acl: "public-read",
  key: function (req, file, cb) {
    cb(null, `avatars/${req.session.user._id}/${Date.now().toString()}`);
  },
});

const s3VideoStorage = multerS3({
  s3: s3Client,
  bucket: "youtubeclone-delicate-smoke-9951",
  acl: "public-read",
  key: function (req, file, cb) {
    cb(null, `videos/${req.session.user._id}/${Date.now().toString()}`);
  },
});

export const deleteS3File = async (key) => {
  const params = {
    Bucket: "youtubeclone-delicate-smoke-9951",
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log(`Deleted ${key} from S3`);
  } catch (err) {
    console.error(`S3's error: ${err}`);
    throw err;
  }
};

export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.loggedInUser = req.session.user || {};
  res.locals.siteName = "Wetube";
  next();
};

export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    req.flash("error", "⚠️ Access denied. Please login first.");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    next();
  } else {
    req.flash("error", "⚠️Not authorized");
    return res.redirect("/");
  }
};

export const avatarUpload = multer({
  limits: {
    fileSize: 10000000,
  },
  storage: s3AvatarStorage,
});

export const videoUpload = multer({
  limits: {
    fileSize: 10000000,
  },
  storage: s3VideoStorage,
});
