var tabsEnabled = {};
var tab;

var hidden = document.getElementById("client_id");
var client_id = hidden.value;
var state = makeid(20);
var url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${client_id}&force_verify=true&redirect_uri=https://www.zhekbot.com/redirect&scope=&state=${state}`;

console.log(url);

tab = document.getElementById("matches-en");
if (tabsEnabled["Warzone Stats / Matches"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("customs-en");
if (tabsEnabled["Customs"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("twovtwo-en");
if (tabsEnabled["Two vs Two"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("duels-en");
if (tabsEnabled["Duels"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("rr-en");
if (tabsEnabled["Revolver Roulette"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("coin-en");
if (tabsEnabled["Coinflip"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("rps-en");
if (tabsEnabled["Rock Paper Scissors"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

tab = document.getElementById("bigvanish-en");
if (tabsEnabled["Big Vanish"]) {
  tab.innerHTML = "Enabled";
  tab.style.color = "green";
} else {
  tab.innerHTML = "Disabled";
}

async function twitch() {
  await fetch(`/login`, {
    headers: {
      "state": state
    }
  })
  .then(res => {
    if (res.status === 200) {
      window.location.href = url;
    } else if (res.status === 201) {
      window.location.href = "/";
    } else {
      throw new Error("Unknown status code on /login: " + res.status);
    }
  })
  .catch(err => {
    console.log(err);
    alert(err);
  });

};

// Random string.
function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}