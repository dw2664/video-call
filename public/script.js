const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const loginForm = document.querySelector("#login-form");
const container = document.querySelector(".containerBody");
const meetingContainer = document.querySelector(".meetingContainerBody");
const main = document.querySelector(".main");
const createMeetingBtn = document.querySelector(".createMeetingBtn");
const joinForm = document.querySelector("#join-form");
myVideo.muted = true;

var peer = new Peer(undefined, {
    path:"/peerjs",
    host:"/",
    port: "8080",
});

let myVideoStream;

var getUserMedia = 
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozeGetUserMedia;

peer.on("call", function (call) {
    getUserMedia(
        {video: true, audio: true},
        function (stream) {
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                addVideoStream(video, remoteStream);
            });
        },
        function (err) {
            console.log("fail to get local stream", err);
        }
    );
});

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
    console.log(ROOM_ID, id);
});

const connectToNewUser = (userId, streams) => {
    var call = peer.call(userId, streams);
    console.log(call);
    console.log(userId);
    console.log("connect to new user call");
    var video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        console.log(userVideoStream);
        addVideoStream(video, userVideoStream);
    });
};

const addVideoStream = (videoEl, stream) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });
    videoGrid.append(videoEl);
};

const playStop = () => {
    console.log("plan stop");
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(enabled);
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    console.log(enabled);
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const setPlayVideo = () => {
    const html = `<i class="unmute fa fa-pause-circle"></i>
    <span class="unmute">Resume Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
    const html = `<i class="fa fa-video-camera"></i>
    <span class="">Pause Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i>
    <span class="unmute">Unmute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>
    <span>Mute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const leaveCall = () => {
    document.location.href = `http://localhost:8080/`;
};

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("js run");
    const submitBtn = loginForm.querySelector(".login-btn");
    submitBtn.innerHTML = "";
    submitBtn.innerHTML = "...";
    submitBtn.disabled = true;
    const data = new FormData(loginForm);
    const body = {
        name: data.get("name"),
        password: data.get("password")
    }
    console.log(body);
    fetch("http://localhost:8080/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {"content-type": "application/json"}
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (item) {
        console.log(item);
        if (item.status) {
            container.style.display = "none";
            meetingContainer.style.display = "flex";
        } else {
            alert(item.message);
        }
      });
    submitBtn.innerHTML = "Login";
})
function initializeMeeting(e) {
    console.log(e);
    if (e) {
        document.location.href = `http://localhost:8080/meet`;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        console.log(stream);
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId => {
            connectToNewUser(userId, stream);
        }));
      });
    container.style.display = "none";
    meetingContainer.style.display = "none";
    main.style.display = "flex";
}

createMeetingBtn.addEventListener("click", initializeMeeting);

joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(joinForm);
    const body = {
        id: data.get("id"),
    }
    console.log(body);
    document.location.href = `http://localhost:8080/${body.id}`;
    console.log(body);
    container.style.display = "none";
    meetingContainer.style.display = "none";
    main.style.display = "flex";
});
if (!document.location.href.includes("login")) {
    initializeMeeting();
}