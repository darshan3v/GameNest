console.log("hey u r in app.js");
// // showdeals();
// var addbtn=document.getElementById("addbtn");
// addbtn.addEventListener("click",deals)
//     function deals()
//     {
//         console.log("time to populate");
//     };

    var signup=document.getElementById("signup");
    signup.addEventListener("click",delay);
    function delay(){

    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data.json', true);
    var newgameid=xhr.send();
    console.log(newgameid);
    // setTimeout(alert(`Account created successfully ${newgameid}`),1000)

    }
