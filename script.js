let flag = false;
let currFolder;
let songs;
let songsUL;
function displaytime(currentTime, duration) {
    // Ensure duration is valid
    if (isNaN(duration) || duration === 0) {
        return; // Don't update UI if duration isn't available yet
    }

    // Convert seconds to minutes and seconds
    let currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);
    let durationMinutes = Math.floor(duration / 60);
    let durationSeconds = Math.floor(duration % 60);

    // Format to ensure two digits
    currentMinutes = currentMinutes.toString().padStart(2, '0');
    currentSeconds = currentSeconds.toString().padStart(2, '0');
    durationMinutes = durationMinutes.toString().padStart(2, '0');
    durationSeconds = durationSeconds.toString().padStart(2, '0');

    // Update UI only when duration is valid
    let d = document.querySelector(".songDuration");
    d.innerHTML = `<div class="songDuration"> ${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}</div>`;
}
function ToggleBurgerCross() {
    const crossSvg = document.querySelector(".crossSvg");
    const hamburger = document.querySelector(".hamburger");

    if (window.innerWidth > 1237) {
        if (crossSvg) crossSvg.classList.remove("hide");
        if (hamburger) hamburger.classList.remove("hide");
    }
}
let currentAudio = null;
let currentPlayingsong = null;
let playsong = (url) => {
    console.log(url);
    if (currentAudio && currentPlayingsong == url) {
        if (currentAudio.paused) { currentAudio.play() }
        else { currentAudio.pause() }
    }
    else {
        if (currentAudio) {
            currentAudio.pause();
        }
        currentAudio = new Audio(url);
        currentAudio.play();
        currentPlayingsong = url;

        currentAudio.addEventListener("timeupdate", () => {
            displaytime(currentAudio.currentTime, currentAudio.duration);
            document.querySelector(".playball").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
        });
    }
    let e = document.querySelector(".songInfo");
    e.innerHTML = `<div>${currentPlayingsong.split("/songs/")[1].replaceAll("%20", " ")}</div>`;
}
let changeSvg = (element) => {
    // Step 1: Reset all song icons to "play.svg"
    document.querySelectorAll(".lib2 ul li .hy").forEach(img => {
        img.src = "play.svg";
    });

    // Step 2: Get the play button of the clicked song
    let c = element.querySelector(".hy");
    let play = document.getElementById("play");

    // Step 3: If the song is playing, show "pause.svg", otherwise show "play.svg"
    if (currentAudio && !currentAudio.paused) {
        c.src = "pause.svg";  // Show pause button when song is playing
        play.src = "pause.svg";
    } else {
        c.src = "play.svg";   // Show play button when song is paused
        play.src = "play.svg";
    }
};
async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${currFolder}/`);
    let response = await a.text();
    // jo b data fetch kia ha usko aik div bana k us mei daal do , uske jo required h data mei se wo further fetch krlo
    let div = document.createElement("div");
    div.innerHTML = (response);
    let links = div.getElementsByTagName("a");
    //ab idhr links (a) sirf song k nhai ha or b hein kuch , so humne songs waly extract krne ha
    let songs = [];
    for (let i = 0; i < links.length; i++) {
        const element = links[i];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${currFolder}/`)[1]);
        }
    }

    return songs;
}



async function displayAlbums() {
    try {
        // Fetch the /songs/ directory
        let a = await fetch('http://127.0.0.1:5500/songs/');
        // if (!a.ok) throw new Error(`Failed to fetch /songs/: ${a.status}`);
        let response = await a.text();
    

    
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
    

        // Get the cardsbox container
        let cardsbox = document.querySelector(".cardsbox");
        // if (!cardsbox) throw new Error("cardsbox element not found in DOM");

        // Clear existing cards to avoid duplicates
        cardsbox.innerHTML = "";

        // Iterate over anchors to find folders
        for (const e of Array.from(anchors)) {
            if (e.href.includes("/songs/") && !e.href.endsWith(".mp3")) {
                let folder = e.href.split("/").slice(-2)[1];
                

                try {
                
                    let infoFetch = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                    // if (!infoFetch.ok) throw new Error(`Failed to fetch info.json for ${folder}: ${infoFetch.status}`);
                    let info = await infoFetch.json();
                    console.log(`Metadata for ${folder}:`, info);

                    // Append card HTML
                    cardsbox.innerHTML += `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="38" height="38"
                                color="#000000" fill="green">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                                <path
                                    d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z"
                                    fill="currentColor" />
                            </svg>
                        </div>
                      <img src="/songs/${folder}/${'cover.jpg'}">


                        <h4>${info.foldername || "Unknown Folder"}</h4>
                        <p>${info.description || "No description available"}</p>
                    </div>`;
                    console.log(`Card added for folder: ${folder}`);
                } catch (error) {
                    console.error(`Error processing folder ${folder}:`, error);
                }
            }
        }

    

        // Attach event listeners using event delegation
        cardsbox.addEventListener("click", async (event) => {
            const card = event.target.closest(".card");
            if (!card) return;

            const folder = card.dataset.folder;
            console.log("Clicked Card, Folder:", folder);

            try {
                // Update global currFolder and songs
                currFolder = `songs/${folder}`;
                songs = await getSongs(currFolder);
                console.log("Songs fetched:", songs);

                // Clear and populate song list
                songsUL = document.querySelector(".lib2 ul");
                if (!songsUL) throw new Error("Song list UL not found");
                songsUL.innerHTML = "";

                for (const song of songs) {
                    songsUL.innerHTML += `<li data-url="/${currFolder}/${song}">
                        <img class="invert" src="music.svg" alt="musicplay">
                        <div class="songname">${song.replaceAll("%20", " ")}</div>
                        <img class="invert hy" src="play.svg" alt="play">
                    </li>`;
                }

                // Attach event listeners to song items
                let songItems = document.querySelectorAll(".lib2 ul li");
                songItems.forEach(element => {
                    element.addEventListener("click", () => {
                        flag = true;
                        let url = element.getAttribute("data-url");
                        playsong(url);
                        changeSvg(element);
                    });
                });
            } catch (error) {
                console.error(`Error handling card click for ${folder}:`, error);
            }
        });
    } catch (error) {
        console.error("Error in displayAlbums:", error);
    }
}

async function main() {

     songs = await getSongs("songs/cs");
     displayAlbums();
    // console.log(songs);
    // ab songs ko display karana ha lib2 mei
     songsUL = document.querySelector(".lib2").getElementsByTagName("ul")[0];
    for (const song of songs) {
        songsUL.innerHTML = songsUL.innerHTML + `<li data-url="/songs/cs/${song}">
                            <img class="invert" src="music.svg" alt="musicplay">
                            <div class="songname"> ${song.replaceAll("%20", " ")} </div>
                            <img class="invert hy" src="play.svg" alt="play">
                        </li>`
    }

    let e = document.querySelector(".songInfo");
    let f = document.querySelector(".lib2 ul li").getElementsByTagName("div")[0];
    e.innerHTML = `<div>${f.innerText}</div>`; // Use innerText instead of src
    let firstAudio = new Audio("/songs/" + songs[0]);
    // Wait for metadata to load so we can access duration
    firstAudio.addEventListener("loadedmetadata", () => {
        displaytime(0, firstAudio.duration); // Show 00:00 / duration
    });


 
    // add event listerner on playing song from lib2
    let a = document.querySelectorAll(".lib2 ul li");
    a.forEach(element => {

        element.addEventListener("click", () => {
            flag = true;
            let b = element.getAttribute("data-url");
            playsong(b);
            changeSvg(element);

        })
    });
    // playing row walay button ha
    // play btn 
    let play = document.getElementById("play");
    play.addEventListener("click", () => {
        if (flag == false) {
            play.src = "pause.svg";

            let firstUrl = document.querySelector(".lib2 ul li")?.getAttribute("data-url");

            if (firstUrl) {
                playsong(firstUrl); // Use existing function to handle play/pause properly
                flag = true;
                //162
            }
        }
        else {
            if (currentAudio.paused) {
                currentAudio.play();
                play.src = "pause.svg";

                document.querySelectorAll(".lib2 ul li").forEach(element => {
                    let url = element.getAttribute("data-url");
                    let svgIcon = element.querySelector(".hy");
                    if (url == currentPlayingsong) { svgIcon.src = "pause.svg"; }
                });
            }
            else {
                currentAudio.pause();
                play.src = "play.svg";

                document.querySelectorAll(".lib2 ul li").forEach(element => {
                    let url = element.getAttribute("data-url");
                    let svgIcon = element.querySelector(".hy");
                    if (url === currentPlayingsong) { svgIcon.src = "play.svg"; }
                });
            }
        }
    });

    // duration line
    let playline = document.querySelector(".playline")
    playline.addEventListener("click", (e) => {
        let totalLength = playline.clientWidth;
        let whereClicked = e.offsetX;
        let position = whereClicked / totalLength * 100;
        console.log(position);
        document.querySelector(".playball").style.left = (position) + "%";
        currentAudio.currentTime = (position / 100) * currentAudio.duration; // Seek audio  
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    document.querySelector(".crossSvg").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    })

    // window.addEventListener("load", ToggleBurgerCross);
    window.addEventListener("resize", ToggleBurgerCross);



    //previous btn
    document.querySelector("#previous").addEventListener("click", () => {
        let a = (currentAudio.src.split("/").slice(-1)[0]);
        // console.log("ye wala src ha", a);
        let index = songs.indexOf(a);
        console.log("ye us song ka index|", index);
        if (index > 0) {
            // playsong(`/songs/${songs[index - 1]}`); 
            playsong(`/${currFolder}/${songs[index - 1]}`);

        } else {
            // console.log("Already at the first song. Can't go back further.");
        }
        // left walay svgs b change krne
        let z = document.querySelectorAll(".lib2 ul li");
        z.forEach(element => {
            let y = element.getAttribute("data-url");
            // if (y === `/songs/${songs[index - 1]}`) {
            if (y === `/${currFolder}/${songs[index - 1]}`) {
                changeSvg(element);
            }
        });


    });

    // next btn 

    document.querySelector("#next").addEventListener("click", () => {
        console.log("previous click hogaya");
        let a = (currentAudio.src.split("/").slice(-1)[0]);
        // console.log("ye wala src ha", a);
        let index = songs.indexOf(a);
        // console.log("ye us song ka index|", index);
        if (index < songs.length - 1) {
            // playsong(`/songs/${songs[index + 1]}`); 
            playsong(`/${currFolder}/${songs[index + 1]}`);

        } else {
            console.log("last ha");
        }
        // left walay svgs b change krne
        let z = document.querySelectorAll(".lib2 ul li");
        z.forEach(element => {
            let y = element.getAttribute("data-url");
            // if (y === `/songs/${songs[index + 1]}`) {
            if (y === `/${currFolder}/${songs[index + 1]}`) {
                changeSvg(element);
            }
        });
    });


 
    
    
}
main();


