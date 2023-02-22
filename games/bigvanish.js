// Import Pool for accessing the database.
import * as helper from "../helper.js"; 


// Function to randomly timeout the user between 100-1,000,000 seconds.
async function bigVanish(id, channel) {
    try {

        // Get value and construct response string.
        let rand = Math.floor(Math.random()*999000)+100;
        
        // Pull user from database.
        let person = (await helper.dbQueryPromise(`SELECT * FROM bigvanish WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`))[0];
        
        if (!person) {

            // User is not in the database. Add them.
            person = { user_id: id, vanish: rand, lowest: rand, stream: channel.substring(1), twitch_id: '' };
            helper.dbQuery(`INSERT INTO bigvanish(user_id, vanish, lowest, stream)VALUES('${person.user_id}', ${person.vanish}, ${person.lowest}, '${channel.substring(1)}');`);

        } else {

            // Update database if new timeout is their highest.
            if (rand > person.vanish) {
                helper.dbQuery(`UPDATE bigvanish SET vanish = ${rand} WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`);
                person.vanish = rand;
            } 
            
            if (rand < person.lowest) {
                helper.dbQuery(`UPDATE bigvanish SET lowest = ${rand} WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`);
                person.lowest = rand;
            }

        }
    
        // Return response.
        return {
            time: rand, 
            person: person
        };

    } catch (err) {
        helper.dumpError(err, "Big Vanish.");
        return {};
    }
  }


  // Function to retrieve the leaderboard.
  async function bigVanishLb(channel) {
    try {

        // Pull users from the database.
        let top = await helper.dbQueryPromise(`SELECT * FROM bigvanish WHERE stream = '${channel.substring(1)}' ORDER BY vanish DESC LIMIT 3;`);
    
        // Format top users.
        let str = [];
        for (let i = 0; i < top.length; i++) {
            str.push(`${top[i].user_id}: ${top[i].vanish} seconds`);
        }

        // Return response.
        return `Big Vanish Leaderboard | ${str.length?str.join(' | '):'No users have played bigvanish yet'}`;
    } catch (err) {
        helper.dumpError(err, "Big Vanish Leaderboard.");
        return '';
    }
  }


// Function to retrieve the lowest timeouts.
async function bigVanishLow(channel) {
    try {

        // Pull users from the database.
        let top = await helper.dbQueryPromise(`SELECT * FROM bigvanish WHERE stream = '${channel.substring(1)}' ORDER BY lowest ASC LIMIT 3;`);
    
        // Format top users.
        let str = [];
        for (let i = 0; i < top.length; i++) {
            if (top[i].lowest === 1000000) continue;
            str.push(`${top[i].user_id}: ${top[i].lowest} seconds`);
        }

        // Return response.
        return `Big Vanish Lowest Leaderboard | ${str.length?str.join(' | '):'No users have played bigvanish yet'}`;
    } catch (err) {
        helper.dumpError(err, "Big Vanish Leaderboard Low.");
        return '';
    }
}


  export { bigVanish, bigVanishLb, bigVanishLow };