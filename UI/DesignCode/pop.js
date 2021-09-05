console.log("Welcome to notes app. This is app.js");
showNotes();

// If user adds a note, add it to the localStorage
let addBtn = document.getElementById("addBtn");
addBtn.addEventListener("click", function(e) {
  let assetid = document.getElementById("assetid");
  let time = document.getElementById("time");
  let amount = document.getElementById("amount");
  let notes = localStorage.getItem("notes");
//   if (notes == null) {
//     notesObj = [];
//   } else {
    notesObj = JSON.parse(notes);
//   }
  let myObj = {
      assetid: assetid.value,
      time: time.value,
      amount: amount.value
  }
  notesObj.push(myObj);
  localStorage.setItem("notes", JSON.stringify(notesObj));
  assetid.value = "";
  time.value = "";
  amount.value = "";
//   console.log(notesObj);
  showNotes();
});

// Function to show elements from localStorage
function showNotes() {
  let notes = localStorage.getItem("notes");
  if (notes == null) {
    notesObj = [];
  } else {
    notesObj = JSON.parse(notes);
  }
  let html = "";
  notesObj.forEach(function(element, index) {
    html += `<div class="card" style="width: 18rem;">
    <ul class="list-group list-group-flush">
      <li class="list-group-item">${element.assetid}</li>
      <li class="list-group-item">${element.time}</li>
      <li class="list-group-item">${element.amount}</li>
    </ul>
  </div>`;
  });
  let notesElm = document.getElementById("notes");
  if (notesObj.length != 0) {
    notesElm.innerHTML = html;
  } else {
    notesElm.innerHTML = `Nothing to show!`;
  }
}
console.log(notesObj);
