// Import Pool for accessing the database.
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});


// Catch pool errors.
pool.on('error', (err) => {
    dumpError(err, "Pool error.");
});


// Discord bot.
import { Client, Intents } from "discord.js";
const discord = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
  

// Logs the Discord bot being initialized.
discord.once('ready', () => {
      console.log('Discord bot logged on.');
    discord.user?.setUsername('zHekBot')
    .catch(err => {
      dumpError(err, "Discord setUsername.");
    });
    discord.user?.setAvatar('./images/Logo.png')
    .catch(err => {
      dumpError(err, "Discord setAvatar.");
    });
});
  

// Loadout command for Discord.
const prefix = "!loadout";
discord.on("messageCreate", (message) => {
    if (message.channel.id === "775090169417826326") {
      if (message.content.startsWith(prefix)) {
        message.author.send("HusKerrs' Loadouts (favorite guns at the top): https://www.kittr.gg/channel/HusKerrs/warzone\n"+
        "If you're having trouble accessing the loadout site, please DM @zHekLeR on Twitch or Discord.")
        .catch(err => {
          dumpError(err, "Discord setUsername.");
        });
      }
      } else if (message.channel.id === "860699279017639936") {
      if (message.content.indexOf('/ban ') >= 0) {
        say('huskerrs', message.content.substring(message.content.indexOf('/ban ')) + ' | Global ban');
      } 
    }
});
  
    
// Log in to the Discord bot.
discord.login(process.env.TOKEN)
.catch(err => {
    dumpError(err, "Discord login.");
});


// DB with error handling.
/**
 * @param {string} query
 */
 function dbQuery(query) {
    pool.query(query)
    .catch(err => {
      dumpError(err, `Query with return: ${query}`);
    });
  }
  
  // DB with return with error handling.
  /**
   * @param {string} query
   * @return {Promise<Array>} 
   */
  function dbQueryPromise(query) {
    return new Promise((resolve, reject) => {
      pool.query(query)
      .then(resp => {
        resolve(resp.rows);
      })
      .catch(err => {
        dumpError(err, `Query with return: ${query}`);
        reject([]);
      });
    });
  }
  
  
// Error handling.
function dumpError(err, where) {
    let errString = '====================\n' + where;
  
    if (typeof err === 'object') {
      if (err.message) {
        errString += '\nMessage: ' + err.message + '\n====================\n';
      }
      if (err.stack) {
        errString += 'Stacktrace:\n====================\n' + err.stack + '\n====================\n';
      }
    } else {
      errString += err;
    }
    errString += '\n====================';
    console.log(errString);
  
    if (errString.includes('404')) return;
  
    discord.users.fetch('364876603097874433')
    .then(resp => {
      resp.send(errString);
    })
    .catch(err => {
      console.log(err);
    });
  }


  export { discord, dbQuery, dbQueryPromise, dumpError };