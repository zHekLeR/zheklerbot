// Import 
import * as helper from "../helper.js"; 


// Constants.
const accepted = { "r": 0, "rock": 0, "p": 1, "paper": 1, "s": 2, "scissors": 2 };
const spr = ["rock", "paper", "scissors"];


// Function to play rock paper scissors. User is timed out for 1 minute if they lose.
async function rps(id, input, stream) {
    try {

        // Determine if input is valid.
        let choice;
        if (Object.keys(accepted).includes(input.toLowerCase())) {
            choice = accepted[input.toLowerCase()];
        } else {
            return { input: false, error: false, result: 0, user: {}, me: 0 };
        }

        // Determine bot choice.
        let rand = Math.floor(Math.random()*3);
        let result = 0;
        if (choice + 1 == rand || (choice == 2 && rand == 0)) {
            result = -1;
        } else if (rand + 1 == choice || (rand == 2 && choice == 0)) {
            result = 1;
        }
    
        // Pull user from the database.
        let person = (await helper.dbQueryPromise(`SELECT * FROM rockpaperscissors WHERE user_id = '${id}' AND stream = '${stream.substring(1)}';`))[0];

        if (!person) {

            // User is not in the database. Add them to it.
            person = { user_id: id, win: result==1?1:0, loss: result==-1?1:0, tie: result==0?1:0, stream: stream.substring(1), twitch_id: '' };
            helper.dbQuery(`INSERT INTO rockpaperscissors(user_id, win, loss, tie, stream)VALUES('${person.user_id}', ${person.win}, ${person.loss}, ${person.tie}, '${stream.substring(1)}');`);

        } else {

            // Update user stats.
            person.win += (result==1?1:0);
            person.loss += (result==-1?1:0);
            person.tie += (result==0?1:0);
            helper.dbQuery(`UPDATE rockpaperscissors SET ${result==1?'win':result==0?'tie':'loss'} = ${result==1?person.win:result==0?person.tie:person.loss} WHERE user_id = '${id}' AND stream = '${stream.substring(1)}';`);

        }
    
        // Return response.
        return { input: true, result: result, user: person, me: spr[rand] };

    } catch (err) {
        return { error: err, input: false, result: 0, me: 0, user: {} };
    }
}


// Function to get user stats.
async function rpsScore(id, channel) {
    try {
    
        // Pull user from the database.
        let person = (await helper.dbQueryPromise(`SELECT * FROM rockpaperscissors WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`))[0];
    
        // Declare response string.
        let str = '';
        if (person) {

            // Format user stats.
            str = `${person.user_id} has won Rock Paper Scissors ${person.win} time${person.win==1?'':'s'}, tied ${person.tie} time${person.tie==1?'':'s'}, and lost ${person.loss} time${person.loss==1?'':'s'}!`
        } else {

            // User has not played.
            str = `${id} has not played Rock Paper Scissors!`;
        }
    
        // Return response.
        return str;

    } catch (err) {
        helper.dumpError(err, "Rock Paper Scissors Score.");
        return '';
    }
}


// Function to get leaderboard.
async function rpsLb(channel) {
    try {

        // Pull users from database.
        let top = await helper.dbQueryPromise(`(SELECT user_id, win, loss, tie FROM rockpaperscissors WHERE win = (SELECT MAX (win) FROM rockpaperscissors WHERE stream = '${channel.substring(1)}') LIMIT 1) UNION ALL (SELECT user_id, win, loss, tie FROM rockpaperscissors WHERE loss = (SELECT MAX (loss) FROM rockpaperscissors WHERE stream = '${channel.substring(1)}') LIMIT 1) UNION ALL (SELECT user_id, win, loss, tie FROM rockpaperscissors WHERE tie = (SELECT MAX (tie) FROM rockpaperscissors WHERE stream = '${channel.substring(1)}') LIMIT 1) ORDER BY win DESC, loss DESC;`);


        if (top.length == 1) {

            // One user has all the top stats.
            top.push(top[0]);
            top.push(top[0]);

        } else if (top.length == 2) {

            // One of these two users has 2 of the top stats.
            if (top[0].loss > top[1].loss) {
                top.push(top[1]);
                top[1] = top[0];
            } else {
                top.push(top[0]);
            }
        }
    
        // Return response.
        return `Rock Paper Scissors Leaderboard | Top Wins: ${top[0].user_id} (${top[0].win}) | Top Losses: ${top[1].user_id} (${top[1].loss}) | Top Ties: ${top[2].user_id} (${top[2].tie})`;

    } catch (err) {
        console.log(err);
        return '';
    }
}


export { rps, rpsScore, rpsLb };