(()=>{const e=document.querySelector("video"),t=document.getElementById("play"),n=t.querySelector("i"),d=document.getElementById("mute"),u=d.querySelector("i"),a=document.getElementById("volume"),l=document.getElementById("currenTime"),o=document.getElementById("totalTime"),s=document.getElementById("timeline"),m=document.getElementById("fullScreen"),i=m.querySelector("i"),r=document.getElementById("videoContainer"),c=document.getElementById("videoControls"),v=document.querySelector(".video__delete-btn");let f=null,E=null,y=.5;e.volume=y;const L=t=>{e.paused?e.play():e.pause(),n.classList=e.paused?"fas fa-play":"fas fa-pause"},p=e=>new Date(1e3*e).toISOString().substr(14,5),g=()=>c.classList.remove("showing");t.addEventListener("click",L),d.addEventListener("click",(t=>{e.muted?(e.muted=!1,0===Number(y)&&(y=.5,e.volume=y)):e.muted=!0,u.classList=e.muted?"fas fa-volume-mute":"fas fa-volume-up",a.value=e.muted?0:y})),a.addEventListener("input",(t=>{const{target:{value:n}}=t;e.muted?(e.muted=!1,u.classList="fas fa-volume-up"):0===Number(n)&&(e.muted=!0,u.classList="fas fa-volume-mute"),y=n,e.volume=n})),e.addEventListener("loadeddata",(()=>{o.innerText=p(Math.floor(e.duration)),s.max=Math.floor(e.duration)})),e.addEventListener("timeupdate",(()=>{l.innerText=p(Math.floor(e.currentTime)),s.value=Math.floor(e.currentTime)})),e.addEventListener("click",L),e.addEventListener("ended",(()=>{const{id:e}=r.dataset;fetch(`/api/videos/${e}/view`,{method:"POST"})})),r.addEventListener("mousemove",(()=>{f&&(clearTimeout(f),f=null),E&&(clearTimeout(E),E=null),c.classList.add("showing"),E=setTimeout(g,3e3)})),r.addEventListener("mouseleave",(()=>{f=setTimeout(g,3e3)})),s.addEventListener("input",(t=>{const{target:{value:n}}=t;e.currentTime=n})),m.addEventListener("click",(()=>{document.fullscreenElement?(document.exitFullscreen(),i.classList="fas fa-expand"):(r.requestFullscreen(),i.classList="fas fa-compress")})),document.addEventListener("keydown",(t=>{document.activeElement!==e||" "!==t.key&&32!==t.keyCode||(t.preventDefault(),L())})),v.addEventListener("click",(e=>{confirm("Are you sure you want to delete?")||e.preventDefault()}))})();