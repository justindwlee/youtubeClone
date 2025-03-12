const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const addComment = (text, id, user) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  const icon = document.createElement("i");
  const span = document.createElement("span");
  const span2 = document.createElement("span");
  const img = document.createElement("img");
  icon.className = "fas fa-comment";
  span.innerText = ` ${user.username}: ${text}`;
  span2.innerText = "❌";
  img.src = `/${user.avatarUrl}`;
  newComment.className = "video__comment";
  newComment.dataset.id = id;
  newComment.appendChild(img);
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = commentForm.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  textarea.value = "";
  const { newCommentId, user } = await response.json();
  if (response.status === 201) {
    addComment(text, newCommentId, user);
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}
