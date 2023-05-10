// // Import 
import * as helper from "../helper.js"; 


async function duel(pOne, pTwo, stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE oppid = '${pTwo.toLowerCase()}' AND stream = '${stream}';`);
        let res2 = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE userid = '${pTwo.toLowerCase()}' AND stream = '${stream}';`);

        if (!res.length && (!res2.length || res2[0].oppid === ' ')) {
            let res3 = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE userid = '${pOne}' AND stream = '${stream}';`);
            let timeout = await helper.dbQueryPromise(`SELECT timeout FROM allusers WHERE user_id = '${stream}';`);
            if (res3.length) {
                if (!res3[0].oppid || res3[0].oppid === ' ') {
                    helper.dbQuery(`UPDATE duelduel SET oppid = '${pTwo.toLowerCase()}', expiration = ${Date.now()/1000 + 120} WHERE userid = '${pOne}' AND stream = '${stream}';`);
                    return `@${pTwo.toLowerCase()} : You've been challenged to a duel by ${pOne}! Type !accept to accept or !coward to deny. Loser is timed out for ${timeout[0].timeout} seconds.`;
                } else {
                    return `@${pOne} : You have already challenged someone to a duel. Type !cancel to cancel it.`;
                }
            } else {
                helper.dbQuery(`INSERT INTO duelduel(oppid, expiration, userid, stream) VALUES ('${pTwo.toLowerCase()}', ${Date.now()/1000 + 120}, '${pOne}', '${stream}');`);
                return `@${pTwo.toLowerCase()} : You've been challenged to a duel by ${pOne}! Type !accept to accept or !coward to deny. Loser is timed out for ${timeout[0].timeout} seconds.`;
            }
        } else {
            return `@${pOne} : This person has already challenged someone / been challenged.`;
        }
    } catch (err) {
        helper.dumpError(err, "Duel.");
        return;
    }
};


async function rematch(pOne, stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE userid = '${pOne.toLowerCase()}' AND stream = '${stream}';`);

        if (!res.length || !res[0].rematch) {
            return;
        }

        return await duel(pOne, res[0].rematch, stream);
    } catch (err) {
        helper.dumpError(err, "Duel Rematch.");
        return;
    }
};


async function cancel(pOne, stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE userid = '${pOne}';`);
        if (res.length) {
            helper.dbQuery(`UPDATE duelduel SET oppid = ' ', expiration = 2147483647 WHERE userid = '${pOne}' AND stream = '${stream}';`);
            return `@${pOne} : You have cancelled the duel.`;
        } else return;
    } catch (err) {
        helper.dumpError(err, "Duel cancel.");
        return;
    }
}


async function coward(pOne, stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE oppid = '${pOne}' AND stream = '${stream}';`);
        if (res.length) {
          helper.dbQuery(`UPDATE duelduel SET oppid = ' ', expiration = 2147483647 WHERE oppid = '${pOne}' AND stream = '${stream}';`);
          return `${pOne} has rejected the duel. L`;
        } 
    } catch (err) {
        helper.dumpError(err, "Duel coward.");
        return;
    }
}


async function accept(pOne, stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE oppid = '${pOne}' AND stream = '${stream}';`);
        let res2 = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE userid = '${pOne}' AND stream = '${stream}';`);

        if (res.length) {

          let rand = Math.round(Math.random());

          if (rand) {

            helper.dbQuery(`UPDATE duelduel SET oppid = ' ', expiration = 2147483647, wins = wins + 1, streak = streak + 1 
              ${res[0].streak + 1 > res[0].longest?', longest = ' + (res[0].streak + 1):''}, rematch = '${pOne}' WHERE userid = '${res[0].userid}' AND stream = '${stream}';`);
            helper.dbQuery(`INSERT INTO duelduel(userid, losses, stream, rematch) VALUES ('${pOne}', 1, '${stream}', '${res[0].userid}')
              ON CONFLICT (userid, stream) DO UPDATE SET losses = duelduel.losses + 1, streak = 0, rematch = '${res[0].userid}';`);
            
            return { winner: res[0].userid, loser: pOne, streak: res[0].streak + 1, twitch_id: res2.length&&res2[0].twitch_id?res2[0].twitch_id:'' };

          } else {

            if (res2.length) {

                helper.dbQuery(`UPDATE duelduel SET wins = wins + 1, streak = streak + 1${res2[0].streak + 1 > res2[0].longest?', longest = ' + (res2[0].streak + 1):''} 
                  WHERE userid = '${pOne}' AND stream = '${stream}';`);
  
              } else {
  
                helper.dbQuery(`INSERT INTO duelduel(userid, wins, stream, streak, longest) VALUES ('${pOne}', 1, '${stream}', 1, 1);`);
              }

            helper.dbQuery(`UPDATE duelduel SET oppid = ' ', expiration = 2147483647, losses = losses + 1, streak = 0, rematch = '${pOne}' WHERE userid = '${res[0].userid}' AND stream = '${stream}';`);

            return { winner: pOne, loser: res[0].userid, streak: (res2.length?res2[0].streak:0) + 1, twitch_id: res.length&&res[0].twitch_id?res[0].twitch_id:'' }
          }
        }
    } catch (err) {
        helper.dumpError(err, "Duel accept.");
        return {};
    }
}


async function duelScore(pOne, stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE userid = '${pOne.toLowerCase()}' AND stream = '${stream}';`);
        if (res.length && (res[0].wins || res[0].losses)) {
          return `${pOne} has won ${res[0].wins} duels and lost ${res[0].losses} for a ${(100*res[0].wins/(res[0].wins+res[0].losses)).toFixed(2)}% win rate.
            They're on a ${res[0].streak} win streak and their longest streak is ${res[0].longest} wins!`;
        } else {
          return `${pOne} has not dueled anyone.`;
        }
    } catch (err) {
        helper.dumpError(err, "Duel score.");
        return;
    }
}


async function duelLb(stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE stream = '${stream}' ORDER BY wins DESC LIMIT 3;`);
        let str = [];
        for (let i = 0; i < res.length; i++) {
          str.push(`${res[i].userid}: ${res[i].wins}`);
        }
        return `Duel Leaderboard: Wins | ${str.length?str.join(' | '):"No one has played yet."}`;
    } catch (err) {
        helper.dumpError(err, "Duel leaderboard.");
        return;
    }
}


async function duelLbRatio(stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT userid, wins, losses, ROUND(wins * 100.0 / (wins + losses), 2) AS percent FROM (SELECT * FROM duelduel WHERE wins + losses >= 10 AND stream = '${stream}') AS rr ORDER BY percent DESC LIMIT 3;`);
        let str = [];
        for (let i = 0; i < res.length; i++) {
          str.push(`${res[i].userid}: ${res[i].percent}% (${res[i].wins + res[i].losses})`);
        }
        return `Duel Leaderboard: Ratio | ${str.length?str.join(' | '):"No one has played yet."}`;
    } catch (err) {
        helper.dumpError(err, "Duel leaderboard ratio.");
        return;
    }
}


async function duelLbRatioLow(stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT userid, wins, losses, ROUND(wins * 100.0 / (wins + losses), 2) AS percent FROM (SELECT * FROM duelduel WHERE wins + losses >= 10 AND stream = '${stream}') AS rr ORDER BY percent ASC LIMIT 3;`);
        let str = [];
        for (let i = 0; i < res.length; i++) {
          str.push(`${res[i].userid}: ${res[i].percent}% (${res[i].wins + res[i].losses})`);
        }
        return `Duel Leaderboard: Ratio | ${str.length?str.join(' | '):"No one has played yet."}`;
    } catch (err) {
        helper.dumpError(err, "Duel leaderboard ratio low.");
        return;
    }
}


async function duelLbStreak(stream) {
    try {
        let res = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE streak = (SELECT MAX(streak) FROM duelduel WHERE stream = '${stream}') AND stream = '${stream}' LIMIT 1;`);
        let longStreak = await helper.dbQueryPromise(`SELECT * FROM duelduel WHERE longest = (SELECT MAX(longest) FROM duelduel WHERE stream = '${stream}') AND stream = '${stream}' LIMIT 1;`);
        return `Duel Leaderboard: Streak | ${res?'Current Longest: ' + res[0].userid + ' (' + res[0].streak + 'W) | Overall Longest: ' + 
          longStreak[0].userid + ' (' + longStreak[0].longest + 'W)':'No one has played yet.'}`;
    } catch (err) {
        helper.dumpError(err, "Duel leaderboard streak.");
        return;
    }
}


export { duel, rematch, cancel, coward, accept, duelScore, duelLb, duelLbRatio, duelLbRatioLow, duelLbStreak };