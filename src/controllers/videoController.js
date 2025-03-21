import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";
import convertS3UrlToCloudFrontUrl from "../utils/s3ToCloudFront";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id)
    .populate("owner")
    .populate({
      path: "comments",
      populate: {
        path: "owner",
      },
    });
  if (!video) {
    return res.render("404", { pageTitle: "404 Video Not Found" });
  }
  return res.render("videos/watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.render("404", { pageTitle: "404 Video Not Found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Editing not allowed!");
    return res.status(403).redirect("/");
  }
  return res.render("videos/edit", {
    pageTitle: `Editing ${video.title}`,
    video,
  });
};

export const postEdit = async (req, res) => {
  const { id } = req.params;
  const { title, description, hashtags } = req.body;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "404 Video Not Found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  req.flash("success", "Changes saved!");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("videos/upload", { pageTitle: "Upload" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;
  const { title, description, hashtags } = req.body;
  // const {
  //   session: {
  //     user: { _id },
  //   },
  //   file: { path: fileUrl },
  //   body: { title, description, hashtags },
  // } = req;
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: convertS3UrlToCloudFrontUrl(video[0].location),
      thumbUrl: convertS3UrlToCloudFrontUrl(thumb[0].location),
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    req.flash("success", "Video uploaded!");
    return res.redirect("/");
  } catch (error) {
    console.log("NOOO!");
    req.flash("error", `${error.message}`);
    return res.status(400).render("videos/upload", {
      pageTitle: "Upload",
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  const user = await User.findById(_id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "404 Video Not Found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Cannot delete video.");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  user.videos.splice(user.videos.indexOf(id), 1);
  user.save();
  req.flash("success", "Video deleted!");
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "i"),
      },
    })
      .sort({ createdAt: "desc" })
      .populate("owner");
  }
  return res.render("videos/search", { pageTitle: "Search Videos", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    params: { id: videoId },
    body: { text },
    session: {
      user: { _id: userId },
    },
  } = req;

  const video = await Video.findById(videoId);
  if (!video) {
    return res.sendStatus(404);
  }
  const user = await User.findById(userId);

  const comment = await Comment.create({
    text,
    owner: userId,
    video: videoId,
  });
  video.comments.push(comment._id);
  video.save();
  return res.status(201).json({ newCommentId: comment._id, user });
};

export const deleteComment = async (req, res) => {
  const {
    user: { _id: userId },
  } = req.session;
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.sendStatus(404);
  }
  if (String(comment.owner) !== String(userId)) {
    return res.sendStatus(403);
  }

  const result = await Comment.findByIdAndDelete(commentId);
  if (!result) {
    return res.status(404);
  }
  const video = await Video.findById(comment.video);
  const commentIndex = video.comments.indexOf(commentId);
  video.comments.splice(commentIndex, 1);
  video.save();
  return res.sendStatus(204);
};
