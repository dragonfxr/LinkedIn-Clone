import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from "./helpers.js";

// Global variables:
let userID = "";

/////////////////0. Helper functions////////////////////
// 0.1 Function to call backend apis
const apiCall = (body, method, path) => {
  return new Promise((resolve, reject) => {
    // parentheses were missing
    const options = {
      method: method,
      headers: {
        "Content-type": "application/json",
      },
    };
    if (method === "GET") {
      // only add the body if the method is not GET (note: GET/HEAD cannot have a body)
      // TODO:
    } else {
      options.body = JSON.stringify(body);
    }

    if (localStorage.getItem("token")) {
      options.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    }

    fetch("http://localhost:5005/" + path, options) //fetch returns a promise
      .then((response) => {
        response.json().then((data) => {
          if (data.error) {
            showErrorPopup(data.error + "😥");
          } else {
            // if function "success" is present, call this function
            resolve(data); // input data into the function to do something
          }
        });
      });
  });
};

// 0.2 Set token and go to user page
const setToken = (token) => {
  localStorage.setItem("token", token);
  show("user-logged-in");
  hide("user-logged-out");
  populateFeed();
};

//0.3 Milestone 2: populate feed to get the jobs that are watched by current user.
const populateFeed = () => {
  // need to specify start index = 0
  //apiCall({}, "GET", "job/feed?start=0").then(displayJobData);
  apiCall({}, "GET", "job/feed?start=0").then((data) => {
    displayJobData(data, "job-list");
  });
};

//0.4 Used in Milestone 5: convert date and time input to "start" that can pass to backend
const dateToStart = (dateId, timeId) => {
  const dateInput = document.getElementById(dateId).value;
  const timeInput = document.getElementById(timeId).value;

  // Concatenate the date and time strings
  let dateTimeString = dateInput + "T" + timeInput + ":00.000Z";

  // Create a new Date object from the concatenated string
  let dateObject = new Date(dateTimeString);

  // Convert the Date object to an ISO-formatted date-time string
  let start = dateObject.toISOString();

  return start;
};

//--------------------------------------------------//
///////////////////////Milestone 1/////////////////////////
////////////////////1.1 Login button///////////////////
document.getElementById("login-button").addEventListener("click", () => {
  const payload = {
    email: document.getElementById("login-email").value,
    password: document.getElementById("login-password").value,
  };
  apiCall(payload, "POST", "auth/login").then((data) => {
    if (data.error) {
      showErrorPopup("data.error + ", "😥");
    } else {
      setToken(data.token);
      userID = data.userId;
      // store the user id in localstorage for further use
      localStorage.setItem("userID", userID);
    }
  });
});

////////////////////1.2 Register button///////////////////
document.getElementById("register-button").addEventListener("click", () => {
  // First confirm Password:
  const secondPassword = document.getElementById("confirm-password").value;
  const payload = {
    email: document.getElementById("register-email").value,
    password: document.getElementById("register-password").value,
    name: document.getElementById("register-name").value,
  };

  const hasEmptyValue = Object.values(payload).some((value) => value === "");

  if (hasEmptyValue) {
    showErrorPopup("Please fill in all information!");
  } else if (secondPassword != payload.password) {
    showErrorPopup("The two passwords do not match!");
  } else {
    // send to backend and excecute function "worked"
    apiCall(payload, "POST", "auth/login").then((data) => {
      if (data.error) {
        showErrorPopup("data.error + ", "😥");
      } else {
        setToken(data.token);
      }
    }); // pass function with one argument "data" into apicall
  }
});

////////////////////////1.3 Error popup/////////////////////
function showErrorPopup(message) {
  const errorPopup = document.getElementById("error-popup");
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = message;
  errorPopup.classList.remove("hide");
}

function closeErrorPopup() {
  const errorPopup = document.getElementById("error-popup");
  errorPopup.classList.add("hide");
}

window.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("close-btn");
  closeBtn.addEventListener("click", closeErrorPopup);
});

///////////////////1.3 Single page navigation - when haven't logged in/////////////////
const show = (element) => {
  document.getElementById(element).classList.remove("hide");
};

const hide = (element) => {
  document.getElementById(element).classList.add("hide");
};
// Go to register page
document.getElementById("nav-register").addEventListener("click", () => {
  show("page-register");
  hide("page-login");
});

// Go back to log in page
document.getElementById("nav-login").addEventListener("click", () => {
  show("page-login");
  hide("page-register");
});

// Clicked log out button (there are a few)
var logOutButton = document.getElementsByClassName(
  "w-100 btn btn-lg btn-primary logout-button"
);

// Loop through the elements and add event listener to each one
for (var i = 0; i < logOutButton.length; i++) {
  logOutButton[i].addEventListener("click", function () {
    show("user-logged-out");
    hide("user-logged-in");
    hide("user-profile-page");
    hide("edit-profile-page");
    hide("other-user-profile-page");
    localStorage.removeItem("token");
  });
}

/////////////////////Milestone 2/////////////////////////////
//////////////////Display job description/////////////////
// print information in DisplayJobDiv
// first argument: data get from backend, second argument:
const displayJobData = (data, elementID) => {
  const displayJobDiv = document.getElementById(elementID);
  displayJobDiv.className = "display-job-div";
  //displayJobDiv.innerText = "";
  for (const job of data) {
    const listItem = document.createElement("li");
    apiCall({}, "GET", `user?userId=${job.creatorId}`).then((userData) => {
      // 2.1 // 2.2
      const creatorDiv = document.createElement("div");
      creatorDiv.classList.add("user-icon");
      const createTimeDiv = document.createElement("div");
      creatorDiv.innerText = `Creator: ${userData.name}`;

      creatorDiv.addEventListener("click", () => {
        if (job.creatorId == userID) {
          hide("user-logged-in");
          hide("add-jobs-page");
          hide("other-user-profile-page");
          show("user-profile-page");
        } else {
          hide("user-logged-in");
          hide("add-jobs-page");
          show("other-user-profile-page");
          hide("user-profile-page");
        }

        apiCall({}, "GET", `user?userId=${job.creatorId}`).then(
          displayOtherUserProfile
        );
      });

      createTimeDiv.innerText = `Create Time: ${formatCreateTime(
        job.createdAt
      )}`;
      listItem.appendChild(creatorDiv);
      listItem.appendChild(createTimeDiv);

      // 2.3
      // add image
      const jobImage = document.createElement("img");
      jobImage.width = 150;
      jobImage.height = 100;
      jobImage.src = job.image;
      listItem.appendChild(jobImage);

      // title
      const titleDiv = document.createElement("div");
      titleDiv.innerText = `Title: ${job.title}`;
      titleDiv.style.fontWeight = "bold";
      listItem.appendChild(titleDiv);

      // Starting date div
      const startingDateDiv = document.createElement("div");
      const startingDate = new Date(job.start);
      const day = startingDate.getDate().toString().padStart(2, "0");
      const month = (startingDate.getMonth() + 1).toString().padStart(2, "0");
      const year = startingDate.getFullYear().toString().padStart(2, "0");
      startingDateDiv.innerText = `Starting date: ${day}/${month}/${year}`;
      listItem.appendChild(startingDateDiv);

      // Job description div
      const descriptionDiv = document.createElement("div");
      descriptionDiv.innerText = `Description: ${job.description}`;
      descriptionDiv.style.marginTop = "8px";
      listItem.appendChild(descriptionDiv);

      // the number of likes
      const likeDiv = document.createElement("div");
      likeDiv.classList.add("like-div");
      const likeImage = document.createElement("img");
      likeImage.src = "../like.jpeg";
      likeImage.classList.add("like-image");
      likeDiv.appendChild(likeImage);
      const numOfLikes = job.likes.length;
      let likeNum = document.createElement("div");
      likeNum.innerText = numOfLikes;
      likeNum.classList.add("like-num");
      likeDiv.appendChild(likeNum);
      // milestone 2.3.3: liking a job
      likeImage.addEventListener("click", () => {
        const payload = {
          id: job.id,
          turnon: true,
        };
        apiCall(payload, "PUT", "job/like");
      });
      // milestone 2.3.1: display like names on a job
      const likeNameDisplay = document.createElement("div");
      likeNameDisplay.classList.add("like-names");
      job.likes.forEach((like) => {
        const likeUserDiv = document.createElement("div");
        likeUserDiv.innerText = like.userName;
        likeNameDisplay.appendChild(likeUserDiv);
        // likeUserDiv can be cliked
        likeUserDiv.classList.add("user-icon");
        likeUserDiv.addEventListener("click", () => {
          if (like.userId == userID) {
            hide("user-logged-in");
            hide("add-jobs-page");
            show("user-profile-page");
            hide("other-user-profile-page");
          } else {
            hide("user-logged-in");
            hide("add-jobs-page");
            show("other-user-profile-page");
            hide("user-profile-page");
          }

          apiCall({}, "GET", `user?userId=${like.userId}`).then(
            displayOtherUserProfile
          );
        });
      });
      likeDiv.appendChild(likeNameDisplay);
      listItem.appendChild(likeDiv);

      // the number of comments
      // Create a comment div
      const commentDiv = document.createElement("div");
      commentDiv.classList.add("comment-div");
      // Comment image
      const commentImage = document.createElement("img");
      commentImage.src = "../comment.png";
      commentImage.classList.add("comment-image");
      commentDiv.appendChild(commentImage);
      // Number of comments
      const numOfComments = job.comments.length;
      const commentNum = document.createElement("div");
      commentNum.innerText = numOfComments;
      commentNum.classList.add("comment-num");
      commentDiv.appendChild(commentNum);

      // Milestone 2.3.2: Show comments on a job
      const commentDisplayButton = document.createElement("button");
      commentDisplayButton.textContent = "Show comments";
      commentDiv.appendChild(commentDisplayButton);
      commentDisplayButton.classList.add("show-comment-button");

      //write comment
      const writeCommentDiv = document.createElement("div");
      writeCommentDiv.classList.add("write-comment-div");

      // Comment input
      const commentInput = document.createElement("input");
      commentInput.setAttribute("type", "text");
      commentInput.setAttribute("placeholder", "Write a comment...");
      commentInput.classList.add("comment-input");
      writeCommentDiv.appendChild(commentInput);

      // Submit comment button
      const submitCommentButton = document.createElement("button");
      submitCommentButton.textContent = "Submit";
      submitCommentButton.classList.add("submit-comment-button");
      writeCommentDiv.appendChild(submitCommentButton);
      submitCommentButton.addEventListener("click", () => {
        const commentText = commentInput.value.trim();
        if (commentText) {
          const payload = {
            id: job.id,
            comment: commentText,
          };
          showErrorPopup("Successfully commented!😘");
          apiCall(payload, "POST", "job/comment").then();
        } else {
          showErrorPopup("Please enter text into comment!🥺");
        }
      });
      listItem.appendChild(writeCommentDiv);

      const commentPopup = document.createElement("div");
      commentPopup.setAttribute("id", "comment-popup");
      const commentContainer = document.createElement("div"); // for comment text
      commentPopup.appendChild(commentContainer);

      const commentCloseButton = document.createElement("button");
      commentCloseButton.setAttribute("id", "close-comment-popup");
      commentCloseButton.textContent = "Close";
      commentCloseButton.classList.add("close-comment-button");
      commentPopup.appendChild(commentCloseButton);
      commentPopup.classList.add("hide");
      // make comment ui better
      const overlay = document.createElement("div");
      overlay.classList.add("overlay");
      overlay.classList.add("hide");
      document.body.appendChild(overlay);

      function showCommentPopup(comments) {
        commentContainer.innerText = "";
        if (numOfComments === 0) {
          commentContainer.textContent = "no comments👀";
        }
        for (let i = 0; i < comments.length; i++) {
          const commentElement = document.createElement("div");
          commentElement.classList.add("comment-item");

          // Create a div element for the user's name
          const userNameElement = document.createElement("div");
          userNameElement.classList.add("comment-user-name");
          userNameElement.textContent = comments[i].userName;
          userNameElement.classList.add("user-icon");
          commentElement.appendChild(userNameElement);
          userNameElement.addEventListener("click", () => {
            if (comments[i].userId == userID) {
              closeCommentPopup();
              hide("user-logged-in");
              hide("add-jobs-page");
              show("user-profile-page");
              hide("other-user-profile-page");
            } else {
              closeCommentPopup();
              hide("user-logged-in");
              hide("add-jobs-page");
              hide("user-profile-page");
              show("other-user-profile-page");
            }
            apiCall({}, "GET", `user?userId=${comments[i].userId}`).then(
              displayOtherUserProfile
            );
          });

          // Create a div element for the comment
          const commentTextElement = document.createElement("div");
          commentTextElement.classList.add("comment-text");
          commentTextElement.textContent = comments[i].comment;
          commentElement.appendChild(commentTextElement);

          commentContainer.appendChild(commentElement);
        }
        commentPopup.classList.remove("hide");
        overlay.classList.remove("hide");
      }

      function closeCommentPopup() {
        commentPopup.classList.add("hide");
        overlay.classList.add("hide");
      }

      commentDisplayButton.addEventListener("click", () => {
        showCommentPopup(job.comments);
      });
      commentCloseButton.addEventListener("click", () => closeCommentPopup());

      listItem.appendChild(commentDiv);
      listItem.appendChild(commentPopup);

      // add dislike
      const dislikeDiv = document.createElement("div");
      dislikeDiv.classList.add("like-div");
      const dislikeImage = document.createElement("img");
      dislikeImage.src = "../dislike.jpeg";
      dislikeImage.classList.add("like-image");
      dislikeDiv.appendChild(dislikeImage);
      listItem.appendChild(dislikeDiv);

      // delete job button
      if (job.creatorId == userID) {
        const deleteDiv = document.createElement("div");

        deleteDiv.classList.add("styled-delete-div");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.classList.add("styled-delete-button");
        deleteDiv.appendChild(deleteButton);
        listItem.appendChild(deleteDiv);

        deleteButton.addEventListener("click", () => {
          // Assuming you have a jobId variable that holds the ID of the job you want to delete
          const jobId = "your_job_id_here";
          const payload = {
            id: job.id,
          };
          apiCall(payload, "DELETE", `job`)
            .then(() => {
              // Remove the listItem from the DOM
              listItem.remove();

              // Show a success message
              showErrorPopup("Sccessfully delete the post! 😀");
            })
            .catch((error) => {
              // Show an error message
              console.error(
                "Failed to delete the job. Please try again later."
              );
            });
        });
      }
    });

    displayJobDiv.appendChild(listItem);
  }
};

const displayOtherUserProfile = (data) => {
  const displayUserDiv = document.getElementById("other-user-data");
  displayUserDiv.innerText = "";

  // User id, email and name:
  const userInfo = document.createElement("div");
  userInfo.classList.add("userInfo");
  userInfo.innerText = `User ID: ${data.id}\nUser Email: ${data.email}\nUser Name: ${data.name}\n`;
  displayUserDiv.appendChild(userInfo);

  // add watch button:
  // const watchDiv = document.createElement("div");
  // watchDiv.classList.add("watch-div");
  // const watchImage = document.createElement("img");
  // watchImage.src = "../watch.png";
  // watchImage.classList.add("watch-image");
  // watchDiv.appendChild(watchImage);
  // displayUserDiv.appendChild(watchDiv);

  // document.addEventListener("click", () => {
  //   let myEmail = "";
  //   apiCall({}, "GET", `user?userId=${userID}`).then((data) => {
  //     myEmail = data.email;
  //   })
  //   const payload = {
  //     email: myEmail,
  //     turnon: true,
  //   };
  //   apiCall(payload, "PUT", "user/watch");
  // });

  // jobs: reused the function developed in milestone 2
  displayJobData(data.jobs, "other-user-job-list");

  // watchees:
  const watcheeHeader = document.createElement("div");
  watcheeHeader.innerText = "This user is watched by the following users:";
  displayUserDiv.appendChild(watcheeHeader);
  for (const watchee of data.watcheeUserIds) {
    apiCall({}, "GET", `user?userId=${watchee}`)
      .then((data) => {
        if (data.error) {
          showErrorPopup(data.error + "😥");
        } else {
          const nameDiv = document.createElement("div");
          const watcheeName = data.name;
          const watcheeNameSpan = document.createElement("span");
          watcheeNameSpan.innerText = `|${watcheeName}|`;
          watcheeNameSpan.classList.add("user-icon");
          nameDiv.appendChild(watcheeNameSpan);

          watcheeNameSpan.addEventListener("click", () => {
            hide("user-logged-in");
            hide("add-jobs-page");
            hide("user-profile-page");
            show("other-user-profile-page");
            apiCall({}, "GET", `user?userId=${watchee}`).then(displayOtherUserProfile);
          });
          displayUserDiv.appendChild(nameDiv);
        }
      })
      // 
  }

};

////////////////////////////////////////////////////////////////////////
// infinite scroll: have not done! hard! relative to milestone 6

let currentPage = 0; // Keep track of the current page

const jobsPerPage = 5; // Define the number of jobs per page

let isLoading = false;

function loadNextPage() {
  if (isLoading) return;
  isLoading = true;

  // Calculate the start index for the current page
  const startIndex = currentPage * jobsPerPage;

  // Replace 'nextFiveJobs' with the appropriate API call to fetch the next set of jobs
  apiCall({ page: currentPage }, "GET", `job/feed?start=${startIndex}`)
    .then((jobs) => {
      displayJobData(jobs, "job-list"); // Use existing function to display the fetched jobs
      if (jobs.length) {
        currentPage++;
        isLoading = false;
      }
    })
    .catch((error) => {
      console.error("Error fetching jobs:", error);
    });
}

function handleScroll() {
  // Calculate the position of the scroll
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight =
    document.documentElement.clientHeight || document.body.clientHeight;
  const scrollHeight =
    document.documentElement.scrollHeight || document.body.scrollHeight;

  if (scrollTop + windowHeight + 200 >= scrollHeight) {
    loadNextPage(); // Load the next set of jobs
  }
}

window.addEventListener("scroll", handleScroll);

// Initial load
loadNextPage();

///////////////////////////////////////////////////////////////////////////

// find the name in /user database throughcreatorId
// trim the time expression
const formatCreateTime = (timestamp) => {
  const createTime = new Date(timestamp);
  const currentTime = new Date();
  const interval = currentTime - createTime;
  const allMinutes = Math.floor(interval / (1000 * 60));
  let hours = Math.floor(allMinutes / 60);
  let minutes = allMinutes - hours * 60;

  if (hours < 24) {
    return `${hours} hours ${minutes} minutes ago`;
  } else {
    const day = createTime.getDate().toString().padStart(2, "0");
    const month = (createTime.getMonth() + 1).toString().padStart(2, "0");
    const year = createTime.getFullYear().toString().padStart(2, "0");
    return `${day}/${month}/${year}`;
  }
};

/////////////////////////Milestone 4/////////////////////////
////////////////////4.1 View own profile button/////////////////////
let viewProfileButton = document.getElementsByClassName(
  "view-my-profile btn btn-primary"
);
for (var i = 0; i < viewProfileButton.length; i++) {
  viewProfileButton[i].addEventListener("click", function () {
    hide("user-logged-in");
    hide("add-jobs-page");
    show("user-profile-page");
    userID = localStorage.getItem("userID");
    apiCall({}, "GET", `user?userId=${userID}`).then(displayUserProfile); ///needs to know user ID
  });
}

/////////////////////4.2 Show own profile/////////////////////
const displayUserProfile = (data) => {
  const displayUserDiv = document.getElementById("user-data");
  displayUserDiv.innerText = "";

  // User id, email and name:
  const userInfo = document.createElement("div");
  userInfo.innerText = `My ID: ${data.id}\nMy Email: ${data.email}\nMy Name: ${data.name}\n`;
  displayUserDiv.appendChild(userInfo);

  // jobs: reused the function developed in milestone 2
  displayJobData(data.jobs, "user-job-list");

  // watchees:
  const watcheeHeader = document.createElement("div");
  watcheeHeader.innerText = "You are watched by the following users:";
  displayUserDiv.appendChild(watcheeHeader);
  for (const watchee of data.watcheeUserIds) {
    apiCall({}, "GET", `user?userId=${watchee}`).then((data) => {
      if (data.error) {
        showErrorPopup(data.error + "😥");
      } else {
        const watcheeName = data.name;
        const watcheeNameSpan = document.createElement("span");
        watcheeNameSpan.innerText = ` |${watcheeName}|`;
        displayUserDiv.appendChild(watcheeNameSpan);
      }
    });
  }
};

////////////////////4.3 Update own profile/////////////////////
document.getElementById("edit-profile").addEventListener("click", () => {
  hide("add-jobs-page");
  hide("user-logged-in");
  hide("user-profile-page");
  show("edit-profile-page");
  document.getElementById("edit-email").value = "";
  document.getElementById("edit-password").value = "";
  document.getElementById("edit-name").value = "";
  document.getElementById("new-description").value = "";
});
document.getElementById("submit-edit-profile").addEventListener("click", () => {
  const payload = {
    email: document.getElementById("edit-email").value,
    password: document.getElementById("edit-password").value,
    name: document.getElementById("edit-name").value,
    image: document.getElementById("new-description").value,
  };
  apiCall(payload, "PUT", "user").then((data) => {
    showErrorPopup("You have successfully edited your profile!");
  });
});

/////////////////////Milestone 5//////////////////////
/////////////// 5.1 Adding new jobs///////////////////
// First go to a new page to add jobs:
document.getElementById("add-jobs").addEventListener("click", () => {
  show("add-jobs-page");
  hide("user-logged-in");
  hide("user-profile-page");
  hide("edit-profile-page");
  document.getElementById("new-title").value = "";
  document.getElementById("new-img").value = "";
  document.getElementById("new-description").value = "";
});
// Go back to logged in page:
var backHomeButton = document.getElementsByClassName(
  "w-100 btn btn-lg btn-primary back-to-login"
);

// Loop through the elements and add event listener to each one
for (var i = 0; i < backHomeButton.length; i++) {
  backHomeButton[i].addEventListener("click", function () {
    hide("user-logged-out");
    show("user-logged-in");
    hide("add-jobs-page");
    hide("user-profile-page");
    hide("edit-profile-page");
    hide("update-job-page");
    hide("other-user-profile-page");
  });
}

// submit a new job
document.getElementById("submit-new-jobs").addEventListener("click", () => {
  const payload = {
    title: document.getElementById("new-title").value,
    image: document.getElementById("new-img").value,
    start: dateToStart("new-date", "new-time"),
    description: document.getElementById("new-description").value,
  };
  // Test if has blank area
  const hasEmptyValue = Object.values(payload).some((value) => value === "");
  if (hasEmptyValue) {
    showErrorPopup("Please fill in all the information!");
  } else {
    apiCall(payload, "POST", "job").then((data) => {
      if (data.error) {
        showErrorPopup(data.error + "😥");
      } else {
        showErrorPopup("You have successfully added a new job!");
      }
    });
  }
});

//////////////////5.2. Updating & deleting a job/////////////////
document.getElementById("edit-jobs-button").addEventListener("click", () => {
  show("update-job-page");
  hide("user-logged-out");
  hide("user-logged-in");
  hide("add-jobs-page");
  hide("user-profile-page");
  hide("edit-profile-page");
});
document.getElementById("submit-update-job").addEventListener("click", () => {
  const payload = {
    id: document.getElementById("update-job-id").value,
    title: document.getElementById("update-job-title").value,
    image: document.getElementById("update-job-img").value,
    start: dateToStart("update-job-date", "update-job-time"),
    description: document.getElementById("update-job-description").value,
  };

  apiCall(payload, "PUT", "job").then((data) => {
    if (data.error) {
      showErrorPopup(data.error + "😥");
    } else {
      showErrorPopup("You have successfully updated your job!");
    }
  });
});

//----------------------------------------------//
////////////////MAIN FUNCTION////////////////////

// If there is a toked stored in local storage, user logged in successfully, so stay at logged in page
// Making sure when the page load, still logged in
if (localStorage.getItem("token")) {
  show("user-logged-in");
  hide("user-logged-out");
  populateFeed();
}
