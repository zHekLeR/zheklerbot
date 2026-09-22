import axios from 'axios';

axios.get(`https://id.twitch.tv/oauth2/validate`, {
    headers: {
        "Authorization": 'OAuth l4xpb08687j93v5516ificaj0ll3p4'
    }
    }).then(res => {
      console.log(res.data);
    }).catch(err => {
      console.log(err.response);
    })