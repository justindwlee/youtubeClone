export const trending = (req, res) => res.send("Trending Videos");
export const see = (req, res) => {
  console.log(req.params);
  res.send(`Watch Video No.${req.params.id}`);
};
export const edit = (req, res) => res.send("Edit Video");
export const search = (req, res) => res.send("Search videos here");
export const upload = (req, res) => res.send("Upload Video");
export const deleteVideo = (req, res) => res.send("Delete Video");
