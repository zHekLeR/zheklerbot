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
import { Client, GatewayIntentBits } from "discord.js";
const discord = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ]
});
  

// Logs the Discord bot being initialized.
discord.once('ready', () => {
      console.log('Discord bot logged on.');
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
  
    if (errString.includes('404') || errString.includes('500')) return;
  
    discord.users.fetch('364876603097874433')
    .then(resp => {
      resp.send(errString)
      .catch(err => {
        console.log(err);
      });
    })
    .catch(err => {
      console.log(err);
    });
  }


  // Check auth cookie.
  async function checkBearer(bearer) {
    try {
      var rows = await dbQueryPromise(`SELECT * FROM permissions WHERE bearer LIKE '%${bearer}%';`);
      if (!rows.length) {
        return [false, {}];
      } else {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].bearer === bearer) {
            return [true, rows[i]];
          } else {
            var bearers = rows[i].bearer.split(',');
            if (bearers.includes(bearer)) {
              return [true, rows[i]];
            } else continue;
          }
        }
      }
      return [false, {}];
    } catch (err) {
      dumpError(err, "Check bearer.");
      return [false, {}];
    }
  }


  // Add auth cookie.
  async function addBearer(userid, bearer) {
    try {
      var rows = await dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${userid}';`);
      if (!rows[0]) {
        dbQuery(`INSERT INTO permissions(userid, bearer) VALUES ('${userid}', '${bearer}');`);
      } else {
        if (!rows[0].bearer) {
          dbQuery(`UPDATE permissions SET bearer = '${bearer}' WHERE userid = '${userid}';`);
        } else {
          dbQuery(`UPDATE permissions SET bearer = '${rows[0].bearer + ',' + bearer}' WHERE userid = '${userid}';`);
        }
      }
      return true; 
    } catch (err) {
      dumpError(err, "Add bearer.");
      return false;
    }
  }


  // Remove auth cookie.
  async function removeBearer(bearer, userid) {
    try {
      var rows = await dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${userid}';`);
      console.log(rows);
      if (rows[0] && rows[0].bearer) {
        var bearers = rows[0].bearer.split(',');
        console.log(bearers);
        if (bearers.length === 1 && bearers[0] === bearer) {
          dbQuery(`UPDATE permissions SET bearer = '' WHERE userid = '${userid}';`);
          return true;
        } else if (bearers.length > 1) {
          if (bearers.indexOf(bearer) < 0) return false;
          bearers.splice(bearers.indexOf(bearer), 1);
          dbQuery(`UPDATE permissions SET bearer = '${bearers.join(',')}' WHERE userid = '${userid}';`);
          return found;
        }
      }
      return false;
    } catch (err) {
      dumpError(err, "Remove bearer.");
      return false;
    }
  }


  export { discord, dbQuery, dbQueryPromise, dumpError, checkBearer, addBearer, removeBearer };