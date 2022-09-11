// // Import 
import * as helper from "../helper.js"; 


// Revolver Roulette! 1/3 chance to get timed out.
async function revolverroulette(id, channel) {
  try {

    // Get random number and determine whether the user won or lost.
    let rand = Math.floor(Math.random()*3);
    let shoot = `${rand?'/me '+id+' survived RR!':'/timeout '+id+' 300 BOOM you died!'}`;

    // Pull user from the Revolver Roulette database.
    let person = await helper.dbQueryPromise(`SELECT * FROM revolverroulette WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`);

    if (!person.length) {

      // User has not played before. Add them to the database.
      person[0] = { user_id: id, survive: 0, die: 0 };
      helper.dbQuery(`INSERT INTO revolverroulette(user_id, survive, die, stream)VALUES('${person[0].user_id}', ${person[0].survive}, ${person[0].die}, '${channel.substring(1)}');`);
      shoot = `@${id}: Revolver Roulette is a game where you have 1/3 chance to be timed out for 5 min. You have been warned.`;

    } else {

      // Update players stats.
      person[0].survive += rand?1:0;
      person[0].die += rand?0:1;
      helper.dbQuery(`UPDATE revolverroulette SET ${rand?'survive':'die'} = ${rand?person[0].survive:person[0].die} WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`)
      shoot += ` ${id}'s record is ${person[0].survive} survival${person[0].survive == 1?'':'s'} and ${person[0].die} death${person[0].die == 1?'':'s'}!`;

    }

    // Return response.
    return shoot;

  } catch (err) {
    helper.dumpError(err, "Revolver Roulette.");
    return '';
  }
};


// Function to get the user's Revolver Roulette stats.
async function revolverrouletteScore(id, channel) {
  try {

    // Pull user from the Revolver Roulette database.
    let person = await helper.dbQueryPromise(`SELECT * FROM revolverroulette WHERE user_id = '${id}' AND stream = '${channel.substring(1)}';`);

    // Declare base response string.
    let str;
    if (person.length) {

      // Format user stats.
      str = `${person[0].user_id} has survived Revolver Roulette ${person[0].survive} time${person[0].survive==1?'':'s'} and died ${person[0].die} time${person[0].die==1?'':'s'}! That's a ${person[0].die?(100*(person[0].survive/(person[0].survive+person[0].die))).toFixed(2)+'%':'perfect'} win rate!`

    } else {

      // User has not played.
      str = `${id} has not played Revolver Roulette!`;

    }

    // Return response.
    return str;

  } catch (err) {
    helper.dumpError(err, "Revolver Roulette Score.");
    return '';
  }
};


// Function to retrieve the leaderboard for Revolver Roulette.
async function revolverrouletteLb(channel) {
  try {

    // Pull users from the database.
    let top = await helper.dbQueryPromise(`SELECT * FROM revolverroulette WHERE stream = '${channel.substring(1)}' ORDER BY survive DESC LIMIT 3;`);
    
    // Put em together.
    let str = [];
    for (let i = 0; i < top.length; i++) {
      str.push(`${top[i].user_id}: ${top[i].survive}`);
    }

    // Return response.
    return `Revolver Roulette Leaderboard: Survivals | ${str.join(' | ')}`;
  } catch (err) {
    helper.dumpError(err, "Revolver Roulette Leaderboard.");
    return '';
  }
};


// Function to retrieve the leaderboard for Revolver Roulette.
async function revolverrouletteLbDie(channel) {
  try {

    // Pull users from the database.
    let top = await helper.dbQueryPromise(`SELECT * FROM revolverroulette WHERE stream = '${channel.substring(1)}' ORDER BY die DESC LIMIT 3;`);
    
    // Put em together.
    let str = [];
    for (let i = 0; i < top.length; i++) {
        str.push(`${top[i].user_id}: ${top[i].die}`);
    }

    // Return response.
    return `Revolver Roulette Leaderboard: Deaths | ${str.join(' | ')}`;
  } catch (err) {
    helper.dumpError(err, "Revolver Roulette Leaderboard Die.");
    return '';
  }
};


// Function to retrieve the leaderboard for Revolver Roulette.
async function revolverrouletteLbRatio(channel) {
  try {

    // Pull users from the database.
    let top = await helper.dbQueryPromise(`SELECT user_id, survive, die, ROUND(survive * 100.0 / (survive + die), 2) AS percent FROM (SELECT * FROM revolverroulette WHERE survive + die >= 25 AND stream = '${channel.substring(1)}') AS rr ORDER BY percent DESC LIMIT 3;`);
    
    // Put em together.
    let str = [];
    for (let i = 0; i < top.length; i++) {
        str.push(`${top[i].user_id}: ${top[i].percent}% in ${top[i].survive + top[i].die} rounds`);
    }

    // Return response.
    return `Revolver Roulette Leaderboard: Survival Ratio | ${str.join(' | ')}`;
  } catch (err) {
    helper.dumpError(err, "Revolver Roulette Leaderboard Ratio.");
    return '';
  }
};


// Function to retrieve the leaderboard for Revolver Roulette.
async function revolverrouletteLbRatioLow(channel) {
  try {

    // Pull users from the database.
    let top = await helper.dbQueryPromise(`SELECT user_id, survive, die, ROUND(survive * 100.0 / (survive + die), 2) AS percent FROM (SELECT * FROM revolverroulette WHERE survive + die >= 25 AND stream = '${channel.substring(1)}') AS rr ORDER BY percent ASC LIMIT 3;`);
    
    // Put em together.
    let str = [];
    for (let i = 0; i < top.length; i++) {
        str.push(`${top[i].user_id}: ${top[i].percent}% in ${top[i].survive + top[i].die} rounds`);
    }

    // Return response.
    return `Revolver Roulette Leaderboard: Survival Ratio | ${str.join(' | ')}`;
  } catch (err) {
    helper.dumpError(err, "Revolver Roulette Leaderboard Ratio Low.");
    return '';
  }
};


// Function to get the total chat stats for Revolver Roulette.
async function revolverrouletteTotals(channel) {
  try {
    
    // Pull all users from the database.
    let top = await helper.dbQueryPromise(`SELECT SUM(survive) AS survives, SUM(die) AS deaths FROM revolverroulette WHERE stream = '${channel.substring(1)}';`);
    
    // Return response.
    return `Revolver Roulette Overall Stats | Survivals: ${top[0].survives} | Deaths: ${top[0].deaths}`;

  } catch (err) {
    helper.dumpError(err, "Revolver Roulette Totals.");
    return '';
  }
};


export { revolverroulette, revolverrouletteScore, revolverrouletteLb, revolverrouletteLbDie, revolverrouletteLbRatio, revolverrouletteLbRatioLow, revolverrouletteTotals };