//@ts-check
// ...
'use strict';
import 'dotenv/config';
import * as helper from "./helper.js";
 
// Loadout command for Discord.
const prefix = "!loadout";
helper.discord.on("messageCreate", (message) => {
    if (message.channel.id === "775090169417826326") {
      if (message.content.startsWith(prefix)) {
        message.author.send("HusKerrs' Loadouts (favorite guns at the top): https://www.kittr.gg/channel/HusKerrs/warzone\n"+
        "If you're having trouble accessing the loadout site, please DM @zHekLeR on Twitch or Discord.")
        .catch(err => {
          helper.dumpError(err, "Discord setUsername.");
        });
      }
      } else if (message.channel.id === "860699279017639936") {
      if (message.content.indexOf('/ban ') >= 0) {
        say('huskerrs', message.content.substring(message.content.indexOf('/ban ')) + ' | Global ban');
      } 
    }
});

// COD API stuff.
import express from "express";
import uniqid from 'uniqid';
import crypto from 'node:crypto';

// HTTP utility.
import axios from 'axios';
import url from 'url';

// Twitch and Discord bots.
import tmi from 'tmi.js';

// Games,
import * as wordle from './games/wordle.js';
import * as revolverroulette from './games/revolverroulette.js';
import * as coinflip from './games/coinflip.js';
import * as rps from './games/rockpaperscissors.js';
import * as bigvanish from './games/bigvanish.js';
import * as duel from './games/duel.js';

// DateTime.
import { DateTime } from 'luxon';

// Cooldowns for games.
let rrcd = [], rpscd = [], cfcd = [], bvcd = [], dcd = [];

// Global cooldowns.
let gcd = { };

// Active elements for each user.
let userIds = {}, online = {};

// Configuration for Twitch API.
const client_config = {
  "client_id": process.env.CLIENT_ID,
  "client_secret": process.env.CLIENT_SECRET
};

// More configuration for Twitch API.
const account_config = {
  "access_token": process.env.ACCESS_TOKEN,
  "refresh_token": process.env.REFRESH_TOKEN,
  "scope": [
      "channel:manage:redemptions",
      "channel:read:redemptions"
  ],
  "token_type": "bearer"
};


// HusKerrs VIPs.
const vips = 'davidtheslayerrr, thunderclap60, neosog, guppii, lululuvely, officialgloriouspcgr, tannerslays, itsthiccchick, craftyjoseph, thanks4dying, mateocrafter1304, hannahnicole4300, stormen, thomdez, fuzwuz, cklaas, triv, zxch, airy_z, bumbobboi, twisttedt, meerko, confire, geesh, missnaruka, gmoe003, femsteph, gdolphn, patriotic, rknhd, rogue_frank, crowder, vileagony, safecojoe, biazar, notjustjohnny, meesterhauns, kurt, midone, muffinwithnobrim, mikedrop39, bronny, swagg, stableronaldo, willo7891, hitstreak, scump, n8brotherwolf, cloakzy, chickitv, karma, soapwingo, joewo, hoffensnieg, deeksjr, tiensochill, gloliva, destroy, its_iron, imr_sa, ochocinco, magalonn, artesianbuilds, azsnakeb1t3, hasham_33, alextumay, pat_o_, nicewigg, 1chilldawg, hideouts_, scummn, momskerrs, p90queen, drawrj, jefedejeff, methodz, valorash_, tyrannymedia, lablakers24, antdavis3, almxnd, jgod_gaming, mafiia_niko, liamferrari, timthetatman, feldubb, holyman, kentb57, l3xu55, bbreadman, sinnerrrr, aydan, unrational, wagnificent, davidtheslayerrr, tommey, zsmit, drakota, mvs_11, ndolok, janegoatt'.split(', ');

// Create the Twitch bot.
const bot = new tmi.Client({
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: 'zhekler',
		password: process.env.TWITCH_BOT
	},
  channels: [ ]
});


/**
 * Handle chats to Twitch.
 * @param {string} channel
 * @param {string} message
 */
function say(channel, message) {
  if (profanity.isProfane(message)) {
    helper.dumpError(message, "Bot.say: channel " + channel);
    return;
  }
  bot.say(channel, message)
  .catch(err => {
    helper.dumpError(err, "Say: " + message);
  })
}

// Two vs Two arrays.
let tvtUpdate = {};

// Logs the Twitch bot being initialized.
bot.on('logon', () => {
  console.log("Twitch bot logged on.");
});

// Free trial up.
let pause = {};

// Tourney commands.
let tourneyComs = ["!mc", "!prize", "!status", "!bracket", "!banned", "!format"];

// Check for commands and respond appropriately.
bot.on('chat', async (channel, tags, message) => {
  try {

    // Return if not a command.
    if (message.charAt(0) !== '!') return;
    if (pause[channel.substring(1)] && tags["username"] !== 'zhekler') return;

    // Get command.
    let splits = message.split(' ');
    let short = splits[0].toLowerCase();

    // Is there a global command set for this chat?
    if (!gcd[channel.substring] || !gcd[channel.substring].length) {
      gcd[channel.substring(1)] = {};
    }

    // Check/set global cooldown on command.
    if (gcd[channel.substring(1)][short] && gcd[channel.substring(1)][short] > Date.now()) return;
    gcd[channel.substring(1)][short] = Date.now() + 2000;

    // Base values.
    let res = [], placement, kills, multis, score, str, rows;
    
    // Disabled commands.
    let coms = userIds[channel.substring(1)].disabled?userIds[channel.substring(1)].disabled.split(','):[];
    if (coms.includes(short)) return;

    // Switch on given command.
    switch (short) {
      // Enable command.
      case '!enable': 
        if (tags['username'] !== channel.substring(1) && !tags['mod']) break;
        if (coms.indexOf(splits[1]) < 0) break;
        coms.splice(coms.indexOf(splits[1]), 1);
        userIds[channel.substring(1)].disabled = coms.join(',');
        helper.dbQuery(`UPDATE allusers SET disabled = '${coms.join(',')}' WHERE user_id = '${channel.substring(1)}';`);
        break;

      case '!disable':
        if (tags['username'] !== channel.substring(1) && !tags['mod']) break;
        if (coms.indexOf(splits[1]) > -1) break;
        coms.push(splits[1]);
        userIds[channel.substring(1)].disabled = coms.join(',');
        helper.dbQuery(`UPDATE allusers SET disabled = '${coms.join(',')}' WHERE user_id = '${channel.substring(1)}';`);
        break;

      // Return commands for this channel.
      case '!commands':
        if (!userIds[channel.substring(1)].commands) break;
        say(channel, `zHekBot commands: https://www.zhekbot.com/commands/${channel.substring(1)}`);
        gcd[channel.substring(1)][short] = Date.now() + 10000;
        break;


      // Start timer.
      case '!starttimer':
        if (tags['username'] !== 'zhekler') break;
        if (!intArray[channel.substring(1)]) intArray[channel.substring(1)] = {};
        if (intArray[channel.substring(1)][splits[1]]) break;
        let time = parseInt(splits[2]);
        intArray[channel.substring(1)][splits[1]] = setInterval(function () {
          say(channel.substring(1), splits.slice(3).join(' '));
        }, time);
        break;

      // Stop timer.
      case '!stoptimer':
        if (tags['username'] !== 'zhekler') break;
        if (!intArray[channel.substring(1)] || !intArray[channel.substring(1)][splits[1]]) break;
        clearInterval(intArray[channel.substring(1)][splits[1]]);
        delete intArray[channel.substring(1)][splits[1]];
        break;


      // Pause this shit.
      case '!pause':
        if (tags["username"] !== 'zhekler' || pause[channel.substring(1)]) break;
        pause[channel.substring(1)] = true;
        say(channel, 'The free trial for zHekBot has expired #payzhekler');
        break;

      // Unpause.
      case '!unpause':
        if (tags["username"] !== 'zhekler' || !pause[channel.substring(1)]) break;
        pause[channel.substring(1)] = false;
        break;


      // Enable Revolver Roulette.
      case '!rron': 
        if (userIds[channel.substring(1)].revolverroulette || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET revolverroulette = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].revolverroulette = true;
        say(channel, `Revolver Roulette has been enabled. Type !rr to play!`);
        break;

      // Disable Revolver Roulette.
      case '!rroff': 
        if (!userIds[channel.substring(1)].revolverroulette || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET revolverroulette = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].revolverroulette = false;
        say(channel, `Revolver Roulette has been disabled.`);
        break;

      // Play Revolver Roulette.
      case '!rr': 
        if (!userIds[channel.substring(1)].revolverroulette) break;
        if (!rrcd[tags["username"] || ''] || rrcd[tags["username"] || ''] < Date.now()) {
          say(channel, await revolverroulette.revolverroulette(tags["display-name"] || tags["username"] || '', channel));
          rrcd[tags["username"] || ''] = Date.now() + 30000;
        }
        break;

      // Get this user's Revolver Roulette score.
      case '!rrscore':
      case '!rrstats':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteScore(tags["display-name"] || tags["username"] || '', channel));
        break;

      // Get another user's Revolver Roulette score.
      case '!rrscoreother':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteScore(message.split(' ')[1], channel));
        break;

      // Get the 3 users with the top survivals in Revolver Roulette.
      case '!rrlb':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLb(channel));
        break;

      // Get the 3 users with the top deaths in Revolver Roulette.
      case '!rrlbdie':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLbDie(channel));
        break;

      // Get the 3 users with the best win / loss ratios in Revolver Roulette.
      case '!rrlbratio':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLbRatio(channel));
        break;

      // Get the 3 users with the worst win / loss ratios in Revolver Roulette.
      case '!rrlbratiolow':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLbRatioLow(channel));
        break;

      // Get the total survivals and deaths for this channel in Revolver Roulette.
      case '!rrtotals':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteTotals(channel));
        break;


      // Enable Coinflip.
      case '!coinon':
        if (userIds[channel.substring(1)].coinflip || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET coinflip = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].coinflip = true;
        say(channel, `Coinflip enabled.`);
        break;

      // Disable Coinflip.
      case '!coinoff':
        if (!userIds[channel.substring(1)].coinflip || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET coinflip = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].coinflip = false;
        say(channel, `Coinflip disabled.`);
        break;

      // Play Coinflip.
      case '!coin':
        if (!userIds[channel.substring(1)].coinflip || splits.length < 2) break;
        if (!cfcd[tags["username"] || ''] || cfcd[tags["username"] || ''] < Date.now()) {
          say(channel, await coinflip.coinflip(tags["display-name"]?tags["display-name"]:tags["username"], message.split(' ')[1], channel));
          rrcd[tags["username"] || ''] = Date.now() + 15000;
        }
        break;

      // Get this user's score in Coinflip. 
      case '!coinscore':
      case '!coinstats':
        if (!userIds[channel.substring(1)].coinflip) break;
        say(channel, await coinflip.coinflipScore(tags["display-name"]?tags["display-name"]:tags["username"], channel));
        break;

      // Get the users with the most wins and the most losses in Coinflip. 
      case '!coinlb':
        if (!userIds[channel.substring(1)].coinflip) break;
        say(channel, await coinflip.coinflipLb(channel));
        break;


      // Enable Rock Paper Scissors.
      case '!rpson':
        if (userIds[channel.substring(1)].rps || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET rps = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].rps = true;
        say(channel, `Rock paper scissors enabled.`);
        break;

      // Disable Rock Paper Scissors.
      case '!rpsoff':
        if (!userIds[channel.substring(1)].rps || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET rps = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].rps = false;
        say(channel, `Rock paper scissors disabled.`);
        break;

      // Play Rock Paper Scissors.
      case '!rps': 
        if (!userIds[channel.substring(1)].rps || splits.length < 2) break;
        if (!rpscd[tags["username"] || ''] || rpscd[tags["username"] || ''] < Date.now()) {
          say(channel, await rps.rps(tags["display-name"]?tags["display-name"]:tags["username"], splits[1], channel));
          rrcd[tags["username"] || ''] = Date.now() + 15000;
        }
        break;

      // Get user's score in Rock Paper Scissors.
      case '!rpsscore': 
      case '!rpsstats':
      if (!userIds[channel.substring(1)].rps) break;
        say(channel, await rps.rpsScore(tags["display-name"]?tags["display-name"]:tags["username"], channel));
        break;

      // Get the users with the most wins, most losses, and most ties in Rock Paper Scissors.
      case '!rpslb':
        if (!userIds[channel.substring(1)].rps) break;
        say(channel, await rps.rpsLb(channel));
        break;


      // Enable Big Vanish. 
      case '!bigvanishon':
        if (userIds[channel.substring(1)].bigvanish || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET bigvanish = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].bigvanish = true;
        say(channel, `Bigvanish enabled.`);
        break;

      // Disable Big Vanish.
      case '!bigvanishoff':
        if (!userIds[channel.substring(1)].bigvanish || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET bigvanish = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].bigvanish = false;
        say(channel, `Bigvanish disabled.`);
        break;

      // Play Big Vanish.
      case '!bigvanish':
        if (!userIds[channel.substring(1)].bigvanish) break;
        if (!bvcd[tags["username"] || ''] || bvcd[tags["username"] || ''] < Date.now()) {
          say(channel, await bigvanish.bigVanish(tags["display-name"]?tags["display-name"]:tags["username"], channel));
          rrcd[tags["username"] || ''] = Date.now() + 15000;
          setTimeout(function() { say(channel, `/untimeout ${tags["username"]}`); }, 3000);
        }
        break;

      // Get the 3 users with the highest timeouts in Big Vanish.
      case '!bigvanishlb':
        if (!userIds[channel.substring(1)].bigvanish) break;
        say(channel, await bigvanish.bigVanishLb(channel));
        break;

      // Get the 3 users with the lowest timeouts in Big Vanish.
      case '!bigvanishlow':
        if (!userIds[channel.substring(1)].bigvanish) break;
        say(channel, await bigvanish.bigVanishLow(channel));
        break;

      
      // Enable customs scoring.
      case '!customon':
        if (userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        if (channel.substring(1) === 'huskerrs') {
          say(channel, '!enable !score false');
          say(channel, '!enable !mc false');
        } else {
          say(channel, 'Custom tourney scoring enabled.');
        }
        helper.dbQuery(`UPDATE allusers SET customs = true WHERE user_id = '${channel.substring(1)}';`);
        rows = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
        if (!rows.length) {
          helper.dbQuery(`INSERT INTO customs(maps, map_count, multipliers, user_id) VALUES ('{"placement":[],"kills":[]}'::json, 8, '1 1', '${channel.substring(1)}');`);
        }
        userIds[channel.substring(1)].customs = true;
        break;

      // Disable customs scoring.
      case '!customoff':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;;
        if (channel.substring(1) === 'huskerrs') {
          say(channel, '!enable !score true');
          say(channel, '!enable !mc true');
        } else {
          say(channel, 'Custom tourney scoring disabled.');
        }
        helper.dbQuery(`UPDATE allusers SET customs = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].customs = false;
        break;

      // Set the number of maps.
      case '!setmaps': 
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1)) || splits.length == 1) break;
        if (!parseInt(splits[1])) {
          say(channel, 'Map count must be an integer.');
          break;
        }
        helper.dbQuery(`UPDATE customs SET map_count = ${parseInt(splits[1])} WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Map count has been set to ${splits[1]}`);
        break;

      // Set the placement string.
      case '!setplacement':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1)) || splits.length % 2 != 1) break;
        let temp = false;
        for (let i = 1; i < splits.length; i++) {
          if (!parseInt(splits[i])) {
            temp = true;
            say(channel, `'Input must be integer pairs. An example for 1st: 2x, 2nd-8th: 1.5x, 9th+: 1x would be '!setplacement 1 2 2 1.5 9 1'`);
            break;
          }
        }
        if (temp) break;
        helper.dbQuery(`UPDATE customs SET multipliers = '${message.substring(message.indexOf(' ') + 1)}' WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Placement multipliers have been updated.`);
        break;

      // Add a map to the scores.
      case '!addmap':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1)) || splits.length != 3) break;
        if (!parseInt(splits[1]) || !parseInt(splits[2])) {
          say(channel, 'Placement and kills must be integers.');
          break;
        }
        res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
        placement = parseInt(message.split(' ')[1]);
        kills = parseInt(message.split(' ')[2]);
        score = 0;
        
        multis = res[0].multipliers.split(' ');
        for (let i = multis.length/2; i >= 0; i--) {
          if (placement >= parseInt(multis[2*i])) {
            score = kills * parseFloat(multis[(2*i)+1]);
            break;
          }
        }
        
        res[0].maps.placement.push(placement);
        res[0].maps.kills.push(kills);
        
        helper.dbQuery(`UPDATE customs SET maps = '${JSON.stringify(res[0].maps)}'::json WHERE user_id = '${channel.substring(1)}';`);
        if (placement > 3 && placement < 21) {
          placement = `${placement}th`;
        } else if (`${placement}`.charAt(`${placement}`.length - 1) === '1') {
          placement = `${placement}st`;
        } else if (`${placement}`.charAt(`${placement}`.length - 1) === '2') {
          placement = `${placement}nd`;
        } else if (`${placement}`.charAt(`${placement}`.length - 1) === '3') {
          placement = `${placement}rd`;
        } else {
          placement = `${placement}th`;
        }
        
        say(channel, `Team ${userIds[channel.substring(1)].pref_name} got ${placement} place with ${kills} kills for ${score.toFixed(2)} points!`);
        break;

      // Remove the last map from the scores.
      case '!removemap':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
        
        res[0].maps.placement.length = res[0].maps.placement.length?res[0].maps.placement.length-1:0;
        
        res[0].maps.kills.length = res[0].maps.kills.length?res[0].maps.kills.length-1:0;
        
        helper.dbQuery(`UPDATE customs SET maps = '{"placement":${res[0].maps.placement.length?'['+res[0].maps.placement.join(',')+']':'[]'},"kills":${res[0].maps.kills.length ?'['+res[0].maps.kills.join(',')+']':'[]'}}'::json WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Last map has been removed.`);
        break;

      // Get the map count.
      case '!mc':
        if (!userIds[channel.substring(1)].customs) break;
        res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
        
        if (res[0].maps.placement.length == res[0].map_count) {
          str = `All maps have been played.`;
        } else {
          str = `Map ${res[0].maps.placement.length + 1} of ${res[0].map_count}`;
        }
        say(channel, str);
        break;

      // Get the score for the maps thus far.
      case '!score':
        if (!userIds[channel.substring(1)].customs && !userIds[channel.substring(1)].two_v_two) break;
        if (userIds[channel.substring(1)].customs) {
          res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
          score = [];
          let total = 0;
          
          multis = res[0].multipliers.split(' '), placement = 0;
          
          for (let i = 0; i < res[0].maps.placement.length; i++) {
            for (let j = multis.length/2; j >= 0; j--) {
              if (parseInt(res[0].maps.placement[i]) >= parseInt(multis[2*j])) {
                placement = parseFloat(multis[(2*j)+1]);
                break;
              }
            }
            
            score.push(`Map ${i + 1}: ${(res[0].maps.kills[i] * placement).toFixed(2)}`);
            total += res[0].maps.kills[i] * placement;
          }
          str = score.join(' | ');
          
          if (score.length < res[0].map_count) str += score.length?` | Map ${score.length + 1}: TBD`:`Map 1: TBD`;
          str += ` | Total: ${total.toFixed(2)} pts`;
          say(channel, str);
        } else if (userIds[channel.substring(1)]["two_v_two"]) {
          await tvtscores(channel.substring(1))
          .catch(err => {
            helper.dumpError(err, `Twitch tvtscores: ${message}`);
          });
        }
        break;

      // Clear all of the maps.
      case '!resetmaps':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE customs SET maps = '{"placement":[],"kills":[]}'::json WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Maps have been reset.`);
        break;


      // Enable match tracking.
      case '!matcheson':
        if (userIds[channel.substring(1)].matches || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        if (!userIds[channel.substring(1)].acti_id) {
          say(channel, `You must first set your Activision ID in the dashboard.`);
          break;
        }
        helper.dbQuery(`UPDATE allusers SET matches = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].matches = true;
        say(channel, `Matches enabled.`);
        break;

      // Disable match tracking.
      case '!matchesoff':
        if (!userIds[channel.substring(1)].matches || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET matches = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].matches = false;
        say(channel, `Matches disabled.`);
        break;

      // Get the last game stats.
      case '!lastgame':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await lastGame(channel.substring(1)));
        break;

      // Get the weekly stats.
      case '!lastgames':
      case '!weekly':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await lastGames(channel.substring(1)));
        break;

      // Get the daily stats.
      case '!daily':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await daily(channel.substring(1)));
        break;

      // Get the daily bombs.
      case '!bombs':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await bombs(channel.substring(1)));
        break;

      // Get the daily wins.
      case '!wins': 
      if (!userIds[channel.substring(1)].matches) break;
        say(channel, await wins(channel.substring(1)));
        break;

      // Get the daily gulag record.
      case '!gulag':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await gulag(channel.substring(1)));
        break;

      // Get lifetime stats.
      case '!stats':
      case '!kd':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await stats(userIds[channel.substring(1)].acti_id, userIds[channel.substring(1)].platform));
        break;

      // Get number of semtex kills.
      case '!kobe':
      case '!semtex':
        if (channel.substring(1) !== 'huskerrs') break;
        say(channel, await semtex());
        break;

      // Get the 5 most frequent teammates this week.
      case '!teammates':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await teammates(userIds[channel.substring(1)].acti_id));
        break;

      // Get the 5 most frequent game modes this week.
      case '!modes':
      case '!gamemodes':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await gamemodes(userIds[channel.substring(1)].acti_id));
        break;
      
      // Get win streak.
      case '!streak':
      case '!winstreak':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await streak(channel.substring(1)));
        break;

      // Enable Two vs Two scoring.
      case '!2v2on':
        if (userIds[channel.substring(1)]["two_v_two"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        if (channel.substring(1) === 'huskerrs') {
          say(channel, '!enable !score false');
        } else {
          say(channel, 'Score recording enabled.');
        }
        helper.dbQuery(`UPDATE allusers SET two_v_two = true WHERE user_id = '${channel.substring(1)}';`);
        helper.dbQuery(`INSERT INTO twovtwo(hkills, tkills, o1kills, o2kills, userid) VALUES (0, 0, 0, 0, '${channel.substring(1)}')
          ON CONFLICT (userid) DO UPDATE SET hkills = 0, tkills = 0, o1kills = 0, o2kills = 0;`);
        userIds[channel.substring(1)]["two_v_two"] = true;
        tvtUpdate[channel.substring(1)] = Date.now();
        break;

      // Disable Two vs Two scoring.
      case '!2v2off':
        if (!userIds[channel.substring(1)]["two_v_two"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;;
        if (channel.substring(1) === 'huskerrs') {
          say(channel, '!enable !score true');
        } else {
          say(channel, 'Score recording disabled.');
        }
        helper.dbQuery(`UPDATE allusers SET two_v_two = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)]["two_v_two"] = false;
        delete tvtUpdate[channel.substring(1)];
        break;
      

      // Enable sub thanking.
      case '!subson':
        if (tags['username'] !== 'zhekler' && tags['username'] !== channel.substring(1)) break;
        helper.dbQuery(`UPDATE allusers SET subs = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].subs = true;
        break;

      // Disable sub thanking.
      case '!subsoff':
        if (tags['username'] !== 'zhekler' && tags['username'] !== channel.substring(1)) break;
        helper.dbQuery(`UPDATE allusers SET subs = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].subs = false;
        break;
      

      // Check the stats of a user.
      case '!check':
        if (!tags['mod'] && !vips.includes(tags['username'] || '') && channel.substring(1) !== tags["username"]) break;
        say(channel, await stats(message.substring(message.indexOf(' ') + 1), 'uno'));
        break;

      // Check the stats of a user, Battlenet.
      case '!checkbattle': 
        if (!tags['mod'] && !vips.includes(tags['username'] || '') && channel.substring(1) !== tags["username"]) break;
        say(channel, await stats(message.substring(message.indexOf(' ') + 1), 'battle'));
        break;


      // Timeout command for VIPs mainly.
      case '!timeout':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        say(channel, `/timeout ${message.substring(message.indexOf(' ') + 1)} | ${tags['username']}`);
        break;

      // Untimeout command for VIPs mainly.
      case '!untimeout':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        say(channel, `/untimeout ${splits[1]}`);
        break;

      // Ban command for VIPs mainly.
      case '!ban':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        say(channel, `/ban ${message.substring(message.indexOf(' ') + 1)} | ${tags['username']}`);
        break;

      // Unban command for VIPs mainly.
      case '!unban':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        say(channel, `/unban ${splits[1]}`);
        break;

      
      // Enable dueling.
      case '!duelon':
        if (userIds[channel.substring(1)].duel || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET duel = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].duel = true;
        say(channel, 'Duels are now enabled.');
        break;

      // Disable dueling.
      case '!dueloff':
        if (!userIds[channel.substring(1)].duel || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET duel = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].duel = false;
        say(channel, 'Duels are now disabled.');
        break;
      
      // Challenge another user to a duel.
      case '!duel': 
        if (!userIds[channel.substring(1)].duel || splits.length == 1) break;
        if (dcd[tags["username"] || ''] && dcd[tags["username"] || ''] > Date.now()) break;
        if (tags["username"]?.toLowerCase() === splits[1].toLowerCase()) {
          say(channel.substring(1), `@${tags["username"]} : You cannot duel yourself.`);
          break;
        }
        if (splits[1].charAt(0) === '@') splits[1] = splits[1].substring(1);
        str = await duel.duel(tags["username"], splits[1], channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Cancel a duel challenge.
      case '!cancel': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.cancel(tags["username"], channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Reject another user's challenge.
      case '!coward': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.coward(tags["username"], channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Accept another user's challenge.
      case '!accept': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.accept(tags["username"], channel.substring(1));
        if (str) {
          say(channel.substring(1), str[0]);
          say(channel.substring(1), str[1]);
        }
        break;

      // Get user's duel score.
      case '!duelscore':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelScore(tags["username"], channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Get another user's duel score.
      case '!duelscoreother':
        if (!userIds[channel.substring(1)].duel || !splits[1]) break;
        str = await duel.duelScore(splits[1], channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Get the 3 users with the most dueling wins.
      case '!duellb':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLb(channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Get the 3 users with the best win / loss ratio in duels.
      case '!duellbratio':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLbRatio(channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Get the 3 users with the worst win / loss ratio in duels.
      case '!duellbratiolow':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLbRatioLow(channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;

      // Get the user with the current longest streak and overall longest streak.
      case '!duellbstreak': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLbStreak(channel.substring(1));
        if (str) say(channel.substring(1), str);
        break;
        

      // Set all of the tourney commands after match is done.
      case '!tourneyend':
        if (channel.substring(1) !== 'huskerrs') break; 
        if (!tags["mod"] && tags["username"] !== channel.substring(1)) break;
        say(channel.substring(1), `!editcom !time It’s currently $(time America/Phoenix "h:mm A") for HusKerrs.`);
        for (let i = 0; i < tourneyComs.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          say(channel.substring(1), `!edit ${tourneyComs[i]} Tourney's over! See !results for more`);
        }
        break;


      // Refresh the userIds cache.
      case '!refresh':
        if (tags["username"] !== 'zhekler') break;
        let users = await helper.dbQueryPromise(`SELECT * FROM allusers;`);
        for (let i = 0; i < users.length; i++) {
          userIds[users[i].user_id] = users[i];
        }
        break;

      
      // Exit the channel.
      case '!zhekleave':
        if (tags["username"] !== channel.substring(1) && tags["username"] !== "zhekler") break;
        userIds[channel.substring(1)].twitch = false;
        helper.dbQuery(`UPDATE allusers SET twitch = false WHERE user_id = '${channel.substring(1)}';`);
        say(channel, 'peepoLeave');
        bot.part(channel)
        .catch(err => {
          helper.dumpError(err, 'Leaving.');
        });
        break;

    }
  } catch (err) {
    helper.dumpError(err, `Twitch bot commands.`);
  }
});


// Two vs Two scores.
/**
 * @param {string} channel
 */
async function tvtscores(channel) {
  try {
    if (!tvtUpdate[channel] || tvtUpdate[channel] < Date.now()) {
      let res = await helper.dbQueryPromise(`SELECT * FROM twovtwo WHERE userid = '${channel}';`);
      let us = res[0].hkills + res[0].tkills;
      let opp = res[0].o1kills + res[0].o2kills;
      say(channel, `${us} - ${opp}${(us==6 && opp==9)?` Nice`:``} | ${us + res[0].mapreset > opp?("Up "+ (us + res[0].mapreset - opp)):(us + res[0].mapreset < opp)?("Down " + (opp - us - res[0].mapreset)):"Tied"}
        ${res[0].mapreset != 0?(res[0].mapreset > 0?' (Up ':' (Down ') + Math.abs(res[0].mapreset) + ' after reset)':''}`);
      tvtUpdate[channel] = Date.now() + 2000;
    }
  } catch (err) {
    helper.dumpError(err, `tvtscores function.`);
  }
} 


// Remove expired challenges.
async function duelExpiration() {
  helper.dbQuery(`UPDATE duelduel SET oppid = ' ', expiration = 2147483647 WHERE expiration < ${Date.now()/1000};`);
}


// Twitch bot subscription handler.
bot.on('subscription', (channel, username, method, message, userstate) => {
  if (!userIds[channel.substring(1)].subs) return;
  say(channel, `${username} Thank you for the sub, welcome to the Huskies huskHype huskLove`);
});


// Twitch bot resubscription handler.
bot.on('resub', (channel, username, months, message, userstate, methods) => {
  if (!userIds[channel.substring(1)].subs) return;
  say(channel, `${username} Thank you for the ${userstate['msg-param-cumulative-months']} month resub huskHype huskLove`);
});


// Make the COD API game_mode more readable.
let game_modes = {
  'br_brquads': 'Battle Royale Quads',
  'br_brtrios': 'Battle Royale Trios',
  'br_brduos': 'Battle Royale Duos',
  'br_brsolo': 'Battle Royale Solos',
  'br_vg_royale_quads': 'Vanguard Royale Quads',
  'br_vg_royale_trio': 'Vanguard Royale Trios',
  'br_vg_royale_duo': 'Vanguard Royale Duos',
  'br_vg_royale_solo': 'Vanguard Royale Solos',
  'br_dmz_plunquad': 'Plunder Quads',
  'br_dmz_pluntrio': 'Plunder Trios',
  'br_dmz_plunduo': 'Plunder Duos',
  'br_dmz_plunsolo': 'Plunder Solos',
  'br_buy_back_quads': 'Buyback Quads',
  'br_buy_back_trios': 'Buyback Trios',
  'br_buy_back_duos': 'Buyback Duos',
  'br_buy_back_solos': 'Buyback Solos',
  'br_rebirth_rbrthquad': 'Resurgence Quads',
  'br_rebirth_rbrthtrios': 'Resurgence Trios',
  'br_rebirth_rbrthduos': 'Resurgence Duos',
  'br_rebirth_rbrthsolos': 'Resurgence Solos',
  'br_rebirth_reverse_playlist_wz325/rbrthsolos': 'Rebirth Reverse',
  'br_rebirth_reverse_playlist_wz325/rbrthduos': 'Rebirth Reverse',
  'br_rebirth_reverse_playlist_wz325/rbrthtrios': 'Rebirth Reverse',
  'br_rebirth_reverse_playlist_wz325/rbrthquads': 'Rebirth Reverse',
  'br_rumble_clash_caldera': 'Clash',
  'br_dmz_playlist_wz325/rbrthbmo_quads': 'Rebirth Reinforced Quads',
  'br_dmz_playlist_wz325/rbrthbmo_trios': 'Rebirth Reinforced Trios',
  'br_dmz_playlist_wz325/rbrthbmo_duos': 'Rebirth Reinforced Duos',
  'br_dmz_playlist_wz325/rbrthbmo_solos': 'Rebirth Reinforced Solos',
  'br_dbd_playlist_wz330/cal_iron_quads': 'Caldera Iron Trial Quads',
  'br_dbd_playlist_wz330/cal_iron_trios': 'Caldera Iron Trial Trios',
  'br_dbd_playlist_wz330/cal_iron_duos': 'Caldera Iron Trial Duos',
  'br_dbd_playlist_wz330/cal_iron_solos': 'Caldera Iron Trial Solos',
  'br_mendota_playlist_wz330': 'Operation Monarch',
  'br_mendota_playlist_wz330/op_mon': 'Monarch Quads',
  'br_respect_playlist_wz335/respect': 'Champion of Caldera',
  'br_rebirth_playlist_wz325/afd_resurgence': 'Totally Normal Rebirth',
  'br_playlist_wz335/rebirthexfilttrios': 'Rebirth Exfil Trios',
  'br_rebirth_playlist_wz340/fortkeep_res_quad': `Fortune''s Keep Quads`,
  'br_rebirth_playlist_wz340/fortkeep_res_trios': `Fortune''s Keep Trios`,
  'br_rebirth_playlist_wz340/fortkeep_res_duos': `Fortune''s Keep Duos`,
  'br_rebirth_reverse_playlist_wz340/fortkeep_res_solo': `Fortune''s Keep Solos`,
  'br_gold_war_playlist_wz340/gld_pldr': 'Golden Plunder',
  'br_rebirth_playlist_wz340/fortkeep_extreme': `Fortune''s Keep Extreme`,
  'br_rumble_playlist_wz340/storage_town_clash_title': 'Storage Town Clash',
  'br_respect_playlist_wz345/respect_trios': 'Champion of Caldera Trios',
  'br_tdbd_playlist_wz345/cal_titanium_quads': 'Titanium Trials Quads',
  'br_wsow_br_trios': 'WSOW Trios',
  'br_tdbd_playlist_wz345/cal_titanium_duos': 'Titanium Trials Duos',
  'br_dbd_playlist_wz320/rbrthdbd_quads': 'Rebirth Iron Trials Quads',
  'br_rebirth_calderaresurgence': 'Caldera Resurgence',
  'br_buy_back_solo': 'Buy Back Solos',
  'br_mmp_playlist_wz350/mmp': 'Sticks and Stones',
  "br_rebirth_cdlr:_fortune's_keep_trios": `Fortune''s Keep Trios`,
  'br_playlist_wz325/br_aprl_fool_name4': 'Totally Normal Battle Royale',
  'br_rebirth_dbd_playlist_wz355/res_trials_quads': 'Rebirth Supreme Quads',
  'br_rebirth_dbd_playlist_wz355/res_trials_trios': 'Rebirth Supreme Trios',
  'br_rebirth_dbd_playlist_wz355/res_trials_duos': 'Rebirth Supreme Duos',
  'br_rebirth_dbd_reverse_playlist_wz355/res_trials_solos': 'Rebirth Supreme Solos'
};


// Constants for queries to the COD API.
let baseCookie = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;";
let loggedIn = false;


// Axios for queries to the COD API.
let apiAxios = axios.create({
  headers: {
    // @ts-ignore
    common: {
      "content-type": "application/json",
      "cookie": baseCookie,
      "x-requested-with": process.env.USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Connection": "keep-alive"
    }
  },
  withCredentials: true
});
let loginAxios = apiAxios;
let defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
console.log("Created apiAxios.");


// Axios for queries to Twitch.
let symAxios = axios.create({
  headers: {      
      // @ts-ignore
      'Client-ID': client_config.client_id,
      'Authorization': 'Bearer ' + account_config.access_token,
      'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      'content-type': 'application/json',
      'Connection': 'keep-alive'
  },
  withCredentials: true
});
console.log("Created symAxios.");


// Handle errors from the COD API.
function apiErrorHandling(error) {
  if (!!error) {
      let response = error.response;
      if (!!response) {
          switch (response.status) {
              case 200:
                  const apiErrorMessage = (response.data !== undefined && response.data.data !== undefined && response.data.data.message !== undefined) ? response.data.data.message : (response.message !== undefined) ? response.message : 'No error returned from API.';
                  switch (apiErrorMessage) {
                      case 'Not permitted: user not found':
                          return '404 - Not found. Incorrect username or platform? Misconfigured privacy settings?';
                      case 'Not permitted: rate limit exceeded':
                          return '429 - Too many requests. Try again in a few minutes.';
                      case 'Not permitted: not allowed':
                          return apiErrorMessage;
                      case 'Error from datastore':
                          return '500 - Internal server error. Request failed, try again.';
                      default:
                          return apiErrorMessage;
                  }  
              case 401:
                  return '401 - Unauthorized. Incorrect username or password.';
              case 403:
                  return '403 - Forbidden. You may have been IP banned. Try again in a few minutes.';
              case 404:
                  return 'Account is set to private.';
              case 500:
                  return '500 - Internal server error. Request failed, try again.';
              case 502:
                  return '502 - Bad gateway. Request failed, try again.';
              default:
                  return `We Could not get a valid reason for a failure. Status: ${response.status}`;
          }
      } else {
          return `We Could not get a valid reason for a failure. Status: ${error}`;
      }
  } else {
      return `We Could not get a valid reason for a failure.`;
  }
};


// Post request for COD API.
function postReq(url, data) {
  return new Promise((resolve, reject) => {
      loginAxios.post(url, data).then(response => {
          resolve(response.data);
      }).catch((error) => {
          reject(apiErrorHandling(error));
      });
  });
};


// Get request for COD API.
function sendRequest(url) {
  return new Promise((resolve, reject) => {
      if (!loggedIn) reject("Not Logged In.");
      apiAxios.get(url).then(response => {

          if (response.data.status !== undefined && response.data.status === 'success') {
              resolve(response.data.data);
          } else {
              reject(apiErrorHandling({
                  response: response
              }));
          }
      }).catch((error) => {
          reject(apiErrorHandling(error));
      });
  });
};


// Login to COD API with SSO.
function loginWithSSO (sso) {
  return new Promise(async (resolve, reject) => {
      if (typeof sso === "undefined" || sso.length <= 0) reject("SSO token is invalid.");
      let loginURL = "https://profile.callofduty.com/cod/mapp/";
      let randomId = uniqid();
      let md5sum = crypto.createHash('md5');
      let deviceId = md5sum.update(randomId).digest('hex');
      postReq(`${loginURL}registerDevice`, {
          'deviceId': deviceId
      }).then((response) => {
          console.log(response);
          let authHeader = response.data.authHeader;
          let fakeXSRF = "68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041";
          // apiAxios.defaults.headers.common.Authorization = `bearer ${authHeader}`;
          apiAxios.defaults.headers.common.x_cod_device_id = `${deviceId}`;
          apiAxios.defaults.headers.common["X-XSRF-TOKEN"] = fakeXSRF;
          apiAxios.defaults.headers.common["X-CSRF-TOKEN"] = fakeXSRF;
          apiAxios.defaults.headers.common["Acti-Auth"] = `Bearer ${sso}`;
          apiAxios.defaults.headers.common["cookie"] = baseCookie + `${baseCookie}ACT_SSO_COOKIE=${sso};XSRF-TOKEN=${fakeXSRF};API_CSRF_TOKEN=${fakeXSRF};`;;
          loggedIn = true;
          resolve("200 - Logged in with SSO.");
      }).catch((err) => {
          if (typeof err === "string") reject(err);
          reject(err.message);
      });
  });
};


// Pull last 20 matches for a player.
function last20(gamertag, platform) {
  return new Promise((resolve, reject) => {
      let urlInput = defaultBaseURL + `crm/cod/v2/title/mw/platform/${platform}/gamer/${gamertag}/matches/wz/start/0/end/0/details`;
      sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  });
};

// 20 matches from date.
function date20(gamertag, platform, date) {
  return new Promise((resolve, reject) => {
    let urlInput = defaultBaseURL + `crm/cod/v2/title/mw/platform/${platform}/gamer/${gamertag}/matches/wz/start/0/end/${date*1000}/details`;
    sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  })
}

// Pull match info from match ID.
function matchInfo(matchID) {
  return new Promise((resolve, reject) => {
      let urlInput = defaultBaseURL + `crm/cod/v2/title/mw/platform/acti/fullMatch/wz/${matchID}/en`;
      sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  });
};


// Pull lifetime stats from COD API.
function lifetime(gamertag, platform) {
  return new Promise((resolve, reject) => {
    let urlInput = defaultBaseURL + `stats/cod/v1/title/mw/platform/${platform}/gamer/${gamertag}/profile/type/wz`;
    sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  });
};


// Create server.
const app = express();

import bodyParser from 'body-parser';
import bodyParserErrorHandler from 'express-body-parser-error-handler';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import favicon from 'serve-favicon';
import Profanity from 'profanity-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonParser = bodyParser.json();
const profanity = new Profanity();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))
app.use(bodyParserErrorHandler());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'images/favicon.ico')));


// Home page.
app.get('/', async (request, response) => {
  let cookies = request.cookies;
  console.log(JSON.stringify(cookies));
  let page;
  if (cookies["auth"]) {
    await axios.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        "Authorization": `Bearer ${cookies["auth"]}`
      }
    }).then(async res => {
      if (res.status === 200) {
        let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);

        if (rows.length) {
          page = fs.readFileSync('./html/page.html').toString('utf-8');
          page = page.replace(/#pref_name#/g, userIds[rows[0].userid].pref_name)
          page = page.replace(/#channel#/g, userIds[rows[0].userid].user_id);
          page = page.replace(/#editors#/g, `<a href="/editors/${rows[0].userid}"><div class="button">Manage your Editors</div></a><br>`);
          page = page.replace(/#checked#/g, userIds[rows[0].userid].twitch?'checked':'');
          page = page.replace('Login to Twitch', 'Logout of Twitch');
          let perms = rows[0]&&rows[0].perms?rows[0].perms.split(','):'';
          if (!perms.length) {
            page = page.replace(/#Permissions#/g, '');
          } else {
            let str = '<h3>Permissions:</h3>';
            for (let i = 0; i < perms.length; i++) {
              str += `<a href="/edit/${perms[i]}"><div class="button">${userIds[perms[i]].pref_name}</div></a>`;
            }
            page = page.replace(/#Permissions#/g, str);
          }
        } else {
          response.redirect('/login');
          return;
        }
        response.send(page); 
      } else {
        helper.dbQuery(`UPDATE permissions SET bearer = '' WHERE bearer = '${cookies["auth"]}';`);
        response.clearCookie('auth', {
          'domain': '.zhekbot.com',
          secure: true,
          httpOnly: true
        });
        response.redirect('/');
      }
    }).catch(err => {
      if (err.toString().includes('401')) {
        helper.dbQuery(`UPDATE permissions SET bearer = '' WHERE bearer = '${cookies["auth"]}';`);
        response.clearCookie('auth', {
          'domain': '.zhekbot.com',
          secure: true,
          httpOnly: true
        });
        response.redirect('/');
      } else {
        helper.dumpError(err, `Home page validation.`);
        response.send(err);
      }
      return;
    });

  } else {
    page = fs.readFileSync('./html/not_enabled.html').toString('utf-8');
    page = page.replace(/#Placeholder#/g, `<a href="/login"><div class="button">It looks like you haven't logged in with Twitch yet. Click here to do that.</div></a>`);
    response.send(page); 
  }
});


// Enable/disable.
app.get('/enable/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(404);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    userIds[request.params.channel].twitch = !userIds[request.params.channel].twitch;

    helper.dbQuery(`UPDATE allusers SET twitch = ${userIds[request.params.channel].twitch} WHERE user_id = '${request.params.channel}';`);

    if (userIds[request.params.channel].twitch) {
      bot.join(request.params.channel)
      .catch(err => {
        helper.dumpError(err, "Twitch enable.");
      });
    } else {
      bot.part(request.params.channel)
      .catch(err => {
        helper.dumpError(err, "Twitch enable.");
      });;
    }

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Enable.`);
    response.sendStatus(500);
  }

});


// Page for other user.
app.get('/edit/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/');
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    await axios.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        "Authorization": `Bearer ${cookies['auth']}`
      }
    }).then(async res => {
      if (res.status === 200) {
        let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies['auth']}';`);

        if (rows.length && rows[0].perms.split(',').includes(request.params.channel.toLowerCase())) {
          let page = fs.readFileSync('./html/page.html').toString('utf-8');
          page = page.replace(/#pref_name#/g, userIds[request.params.channel.toLowerCase()].pref_name);
          page = page.replace(/#channel#/g, userIds[request.params.channel.toLowerCase()].user_id);
          page = page.replace(/#Permissions#/g, '');
          page = page.replace(/#editors#/g, '');
          page = page.replace(/#checked#/g, userIds[request.params.channel.toLowerCase()].twitch?'checked':'');
          page = page.replace(/Login to Twitch/g, 'Logout of Twitch');

          response.send(page);
        } else {
          response.status(403);
          response.redirect('/');
        }
      } else {
        response.status(403);
        response.redirect('/');
      }
    }).catch(err => {
      console.log(err);
      response.status(500);
      response.redirect('/');
    })
  } catch (err) {
    helper.dumpError(err, `Editors home page.`);
    response.status(500);
    response.redirect('/');
  }
});


// Commands page.
app.get('/commands/:channel', (request, response) => {
  let comPage;
  if (Object.keys(userIds).includes(request.params.channel.toLowerCase())) {
    comPage = fs.readFileSync("./html/commands.html").toString('utf-8');
    comPage = comPage.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);
    comPage = comPage.replace('let tabsEnabled = {};', `let tabsEnabled = {
      'Warzone Stats / Matches': ${userIds[request.params.channel.toLowerCase()].matches},
      'Revolver Roulette': ${userIds[request.params.channel.toLowerCase()].revolverroulette},
      'Coinflip': ${userIds[request.params.channel.toLowerCase()].coinflip},
      'Rock Paper Scissors': ${userIds[request.params.channel.toLowerCase()].rps},
      'Big Vanish': ${userIds[request.params.channel.toLowerCase()].bigvanish},
      'Custom Tourney': ${userIds[request.params.channel.toLowerCase()].customs},
      'Two vs Two': ${userIds[request.params.channel.toLowerCase()]["two_v_two"]},
      'Duel': ${userIds[request.params.channel.toLowerCase()].duel}
    };`);
  } else {
    response.status(404);
    comPage = fs.readFileSync("./html/not_found.html").toString('utf-8');
  }
  let cookies = request.cookies;
  if (cookies["auth"]) {
    comPage = comPage.replace('Login to Twitch', 'Logout of Twitch');
  }
  response.send(comPage);
});


// Editors.
app.get('/editors/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(404);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || rows[0].userid !== request.params.channel.toLowerCase()) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    let page = fs.readFileSync('./html/editors.html').toString('utf-8');

    let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE perms LIKE '%${request.params.channel}%';`);

    let str = '';
    for (let i = 0; i < rows.length; i++) {
      let perms = rows[i].perms.split(',');
      if (perms.includes(request.params.channel)) {
        str += `<tr><th>${rows[0].userid}</th><th><div class="button" onclick="remove(this)">Remove</div></th></tr>`;
      }
    }
    page = page.replace(/#editors#/g, str);
    page = page.replace(/#pref_name#/g, userIds[request.params.channel].pref_name);
    page = page.replace(/#channel#/g, userIds[request.params.channel].user_id);

    response.send(page);
  } catch (err) {
    helper.dumpError(err, `Editors web view.`);
    response.sendStatus(500);
  }
});


// Add editor.
app.get('/addeditor/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel] || !request.get('editor')) {
      response.sendStatus(404);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || rows[0].userid !== request.params.channel.toLowerCase()) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${request.get('editor')}';`);
    if (!rows.length) {
      helper.dbQuery(`INSERT INTO permissions(userid, perms) VALUES ('${request.get('editor')}', '${request.params.channel}')`);
    } else if (!rows[0].perms.split(',').includes(request.params.channel)) {
      helper.dbQuery(`UPDATE permissions SET perms = perms || ',${request.params.channel}' WHERE userid = '${request.get('editor')}';`);
    }

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Add editor.`);
    response.sendStatus(500);
  }
});


// Remove editor.
app.get('/removeeditor/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(404);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || rows[0].userid !== request.params.channel) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    if (!request.get('editor')) {
      response.sendStatus(404);
      return;
    }

    let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${request.get('editor')}';`);
    let perms = rows[0].perms.split(',');
    perms.splice(rows[0].perms.indexOf(request.params.channel), 1);
    helper.dbQuery(`UPDATE permissions SET perms = '${perms.join(',')}' WHERE userid = '${request.get('editor')}';`);

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Remove editor.`);
    response.sendStatus(500);
  }
});


// States.
let states = [];


// Modules.
app.get('/modules/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(404);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    let page = fs.readFileSync('./html/modules.html').toString('utf-8');
    page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()].user_id);
    page = page.replace('let tabsEnabled = {};', `let tabsEnabled = {
      'Warzone Stats / Matches': ${userIds[request.params.channel.toLowerCase()].matches},
      'Revolver Roulette': ${userIds[request.params.channel.toLowerCase()].revolverroulette},
      'Coinflip': ${userIds[request.params.channel.toLowerCase()].coinflip},
      'Rock Paper Scissors': ${userIds[request.params.channel.toLowerCase()].rps},
      'Big Vanish': ${userIds[request.params.channel.toLowerCase()].bigvanish},
      'Custom Tourney': ${userIds[request.params.channel.toLowerCase()].customs},
      'Two vs Two': ${userIds[request.params.channel.toLowerCase()]["two_v_two"]},
      'Duels': ${userIds[request.params.channel.toLowerCase()].duel}
    };`);
    page = page.replace(/#Acti#/g, userIds[request.params.channel.toLowerCase()] && userIds[request.params.channel.toLowerCase()].acti_id?userIds[request.params.channel.toLowerCase()].acti_id:''); 
    page = page.replace(/#pref_name#/g, userIds[request.params.channel.toLowerCase()].pref_name || '');

    response.send(page);
  } catch (err) {
    helper.dumpError(err, `Modules web view.`);
    response.sendStatus(500);
  }
});


// Enable/disable modules.
app.get('/modules/:channel/:module', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(405);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    let str = '';
    if (request.params.module === 'matches') {
      let acti_id = request.get('Acti') || '';
      if (!userIds[request.params.channel].matches && 
          (!userIds[request.params.channel].acti_id || userIds[request.params.channel].acti_id === '' || userIds[request.params.channel].acti_id !== decodeURIComponent(acti_id))) {
        if (acti_id === '') throw new Error('Blank Acti ID.');
        if (profanity.isProfane(acti_id || '')) throw new Error('No profanity allowed.');
        str += `, acti_id = '${decodeURIComponent(acti_id || '')}'`;
        userIds[request.params.channel].acti_id = decodeURIComponent(acti_id || '');
        let data = await last20(acti_id, 'uno');
        str += `, uno_id = '${data.matches[0].player.uno}'`;
      }

      await symAxios.get(`https://api.twitch.tv/helix/users?login=${request.params.channel}`,
      {
        headers: {
          "Client-Id": "" + process.env.CLIENT_ID,
          "Authorization": "Bearer " + process.env.ACCESS_TOKEN
        }
      }).then(async resp => {
        if (!userIds[request.params.channel].matches && !userIds[request.params.channel].event_sub) {
          if (!userIds[request.params.channel].online_sub_id) setTimeout(function() {
            symAxios.post('https://api.twitch.tv/helix/eventsub/subscriptions',
            {
              "type": "stream.online", 
              "version": "1", 
              "condition": { 
                "broadcaster_user_id": resp.data.data[0].id
              },
              "transport": {
                "method": "webhook",
                "callback": "https://www.zhekbot.com/eventsub",
                "secret": process.env.SECRET
              }
            },
            {
              headers: {
                "Client-Id": "" + process.env.CLIENT_ID,
                "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
                "Content-Type": "application/json"
              }
            }).then(resp => {
              helper.dbQuery(`UPDATE allusers SET online_sub_id = '${resp.data.data[0].id}' WHERE user_id = '${request.params.channel}';`);
              userIds[request.params.channel].online_sub_id = resp.data.data[0].id;
              console.log("Added stream.online event sub for " + request.params.channel);
            }).catch(err => {
              helper.dumpError(err, "Event Sub - Modules - Add stream.online.");
            });
          }, 2500);

          if (!userIds[request.params.channel].offline_sub_id) setTimeout(function () { 
            symAxios.post('https://api.twitch.tv/helix/eventsub/subscriptions',
            {
              "type": "stream.offline", 
              "version": "1", 
              "condition": { 
                "broadcaster_user_id": resp.data.data[0].id
              },
              "transport": {
                "method": "webhook",
                "callback": "https://www.zhekbot.com/eventsub",
                "secret": process.env.SECRET
              }
            },
            {
              headers: {
                "Client-Id": "" + process.env.CLIENT_ID,
                "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
                "Content-Type": "application/json"
              }
            }).then(resp => {
              helper.dbQuery(`UPDATE allusers SET offline_sub_id = '${resp.data.data[0].id}' WHERE user_id = '${request.params.channel}';`);
              userIds[request.params.channel].offline_sub_id = resp.data.data[0].id;
              console.log("Added stream.offline event sub for " + request.params.channel);
            }).catch(err => {
              helper.dumpError(err, "Event Sub - Modules - Add stream.offline.");
            });
          }, 5000);
          
          helper.dbQuery(`UPDATE allusers SET event_sub = true::bool WHERE user_id = '${request.params.channel}';`);
          userIds[request.params.channel].event_sub = true;

          let mCache = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${request.params.channel}';`);
          if (!mCache || !mCache.length) weekMatches(request.params.channel);

        } else if (userIds[request.params.channel].matches && userIds[request.params.channel].event_sub) {
          if (userIds[request.params.channel].online_sub_id) setTimeout(function() {
            symAxios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${userIds[request.params.channel].online_sub_id}`,
            {
              headers: {
                "Client-Id": "" + process.env.CLIENT_ID,
                "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
              }
            }).then(resp => {
              helper.dbQuery(`UPDATE allusers SET online_sub_id = NULL WHERE user_id = '${request.params.channel}';`);
              delete userIds[request.params.channel].online_sub_id;
              console.log("Removed stream.online event sub for " + request.params.channel);
            }).catch(err => {
              helper.dumpError(err, "Event Sub - Modules - Remove stream.online.");
            });
          }, 2500);

          if (userIds[request.params.channel].online_sub_id) setTimeout(function () { 
            symAxios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${userIds[request.params.channel].offline_sub_id}`,
            {
              headers: {
                "Client-Id": "" + process.env.CLIENT_ID,
                "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
              }
            }).then(resp => {
              helper.dbQuery(`UPDATE allusers SET offline_sub_id = NULL WHERE user_id = '${request.params.channel}';`);
              delete userIds[request.params.channel].offline_sub_id;
              console.log("Removed stream.offline event sub for " + request.params.channel);
            }).catch(err => {
              helper.dumpError(err, "Event Sub - Modules - Remove stream.offline.");
            });
          }, 5000);

          helper.dbQuery(`UPDATE allusers SET event_sub = false::bool WHERE user_id = '${request.params.channel}';`);
          userIds[request.params.channel].event_sub = false;
        }
        
      })
      .catch(err => {
        helper.dumpError(err, "Event Sub - Modules.");
      })
    } else if (request.params.module === 'customs') {
      helper.dbQuery(`INSERT INTO customs(maps, map_count, multipliers, user_id) VALUES ('{"placement":[],"kills":[]}'::json, 8, '1 1', '${request.params.channel}') ON CONFLICT (user_id) DO NOTHING;`);
    }

    userIds[request.params.channel][request.params.module] = !userIds[request.params.channel][request.params.module];
    helper.dbQuery(`UPDATE allusers SET ${request.params.module} = ${userIds[request.params.channel][request.params.module]}${str} WHERE user_id = '${request.params.channel}';`);
  
    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Change module status: ${request.params.channel} | ${request.params.module}.`);
    response.sendStatus(err.toString().includes('not allowed')?401:err.toString().includes('Not found')?404:500);
  }
});


// Set new preferred name.
app.get('/newname/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(404);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    if (profanity.isProfane(request.get('pref_name') || '')) throw new Error('No profanity allowed.');
    userIds[request.params.channel].pref_name = request.get('pref_name');

    helper.dbQuery(`UPDATE allusers SET pref_name = '${request.get('pref_name')}' WHERE user_id = '${request.params.channel}';`);

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Update pref name.`);
    response.sendStatus(500);
  }
});


// Redirect.
app.get('/redirect', (request, response) => {
  response.send(fs.readFileSync("./html/redirect.html").toString("utf-8"));
});


// Log in to Twitch.
app.get('/login', async (request, response) => {
  try {
    let cookies = request.cookies;
    if (!cookies["auth"]) {
      let state;
      do {
        state = makeid(20);
      } while (states.includes(state));
      states[state] = '#login#';
      let page = fs.readFileSync('./html/verify.html').toString('utf-8');
      
      page = page.replace('${process.env.CLIENT_ID}', process.env.CLIENT_ID || '');
      page = page.replace('${state}', state);
      response.send(page);
      setTimeout(function() {
        if (states.indexOf(state) > -1) delete states[state];
      }, 30000);
    } else {
      helper.dbQuery(`UPDATE permissions SET bearer = '' WHERE bearer = '${cookies["auth"]}';`);
      response.clearCookie('auth', {
        'domain': '.zhekbot.com',
        secure: true,
        httpOnly: true
      });
      response.redirect('/');
    }
  } catch (err) {
    helper.dumpError(err, `Login.`);
    response.send(err);
  }
});


// Verify state.
app.get('/verify', (request, response) => {
  try {
    if (request.get("state") === "access_denied") {
      console.log("Access denied in login.");
      response.send("Access was denied.");
      return;
    }
    
    if (Object.keys(states).includes(request.get("state") || '')) {
      axios.post('https://id.twitch.tv/oauth2/token', 
        `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`, 
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
      }).then(resp => {
        axios.get('https://api.twitch.tv/helix/users?', {
          headers: {
            'Authorization': `Bearer ${request.get("access_token")}`,
            'Client-Id': process.env.CLIENT_ID || ''
          }
        }).then(async res => {
          let details = res.data.data;
          let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${details[0]["display_name"].toLowerCase()}';`);
          
          // @ts-ignore
          if (rows.length && (rows[0].perms > 0 && rows[0].perms.split(',').includes(states[request.get("state")]) || details[0]["display_name"].toLowerCase() === states[request.get("state")] || states[request.get("state")] === "#login#")) {
            helper.dbQuery(`UPDATE permissions SET bearer = '${resp.data["access_token"]}' WHERE userid = '${details[0]["display_name"].toLowerCase()}';`);
            response.cookie("auth", resp.data["access_token"], { maxAge: 1000*resp.data.expires_in, secure: true, httpOnly: true, domain: `.zhekbot.com` });
            response.send("Success.");
          } else {
            
            // @ts-ignore
            if (details[0]["display_name"].toLowerCase() === states[request.get("state")] || states[request.get("state")] === '#login#') {
              helper.dbQuery(`INSERT INTO permissions(userid, bearer) VALUES ('${details[0]["display_name"].toLowerCase()}', '${resp.data["access_token"]}');`);
              response.cookie("auth", resp.data["access_token"], { maxAge: 1000*resp.data.expires_in, secure: true, httpOnly: true, domain: `.zhekbot.com` });
              response.send("Success.");
            } else { 
              response.send("Login request failed."); 
              return;
            }
          }

          if (!userIds[details[0]["display_name"].toLowerCase()]) {
            userIds[details[0]["display_name"].toLowerCase()] = {
              "user_id": details[0]["display_name"].toLowerCase(),
              "uno_id": '',
              "platform": "uno",
              "customs": false,
              "matches": false,
              "revolverroulette": false,
              "coinflip": false,
              "rps": false,
              "bigvanish": false,
              "acti_id": '',
              "subs": false,
              "two_v_two": false,
              "twitch": false,
              "duel": false,
              "pref_name": details[0]["display_name"]
            };
            helper.dbQuery(`INSERT INTO allusers(user_id, pref_name) VALUES ('${details[0]["display_name"].toLowerCase()}', '${details[0]["display_name"]}');`);
          }

        }).catch(err => {
          helper.dumpError(err, `Verify users.`);
          response.send(err);
        });
      }).catch(err => {
        helper.dumpError(err, `Verify token.`);
        response.send(err);
      });
    } else {
      console.log("Invalid state.");
      response.send("The request has expired, please try again.");
    }
  } catch (err) {
    helper.dumpError(err, `Verify overall.`);
    response.send(err);
  }
});


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


// 2v2
app.get('/twovtwo/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.send(fs.readFileSync('./html/not_found.html'));
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    let page = fs.readFileSync('./html/two_v_two.html').toString('utf-8');
    page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);
    page = page.replace(/#channel#/g, userIds[request.params.channel].user_id);
    response.send(page);
  } catch (err) {
    helper.dumpError(err, `2v2 overall.`);
    response.send(err.message);
  }
});


// Get 2v2 scores.
app.get ('/twovtwoscores/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    
    let cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    let res = await helper.dbQueryPromise(`SELECT * FROM twovtwo WHERE userid = '${request.params.channel}';`);
    if (!res.length) {
      res = [{ 
        hkills: 0,
        tkills: 0,
        o1kills: 0,
        o2kills: 0,
        tname: '',
        o1name: '',
        o2name: '',
        mapreset: 0
      }];
      helper.dbQuery(`INSERT INTO twovtwo(userid, hkills, tkills, o1kills, o2kills, tname, o1name, o2name, mapreset) VALUES ('${request.params.channel}', 0, 0, 0, 0, '', '', '', 0);`);
    }

    response.send(`${res[0].hkills},${res[0].tkills},${res[0].o1kills},${res[0].o2kills},${res[0].tname},${res[0].o1name},${res[0].o2name},${userIds[res[0].userid] && userIds[res[0].userid]["two_v_two"]},${userIds[res[0].tname] && userIds[res[0].tname]["two_v_two"] && rows[0].perms.split(',').includes(res[0].tname.toLowerCase())},${userIds[res[0].o1name] && userIds[res[0].o1name]["two_v_two"] && rows[0].perms.split(',').includes(res[0].o1name.toLowerCase())},${userIds[res[0].o2name] && userIds[res[0].o2name]["two_v_two"] && rows[0].perms.split(',').includes(res[0].o2name.toLowerCase())},${res[0].mapreset}`);
  } catch (err) {
    helper.dumpError(err, `2v2 scores.`);
    response.send(err.message);
  }
});


// Reset
app.get('/post/:channel/reset', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.sendStatus(405);
      return;
    }
    
    let cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.params.channel}';`);
    if (userIds[request.get('tname')] && userIds[request.get('tname')]["two_v_two"] && rows[0].perms.split(',').includes(request.params.channel.toLowerCase())) {
      helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.get('tname')}';`)
    }
    if (userIds[request.get('o1name')] && userIds[request.get('o1name')]["two_v_two"] && rows[0].perms.split(',').includes(request.params.channel.toLowerCase())) {
      helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.get('tname')}';`)
    }
    if (userIds[request.get('o2name')] && userIds[request.get('o2name')]["two_v_two"] && rows[0].perms.split(',').includes(request.params.channel.toLowerCase())) {
      helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.get('tname')}';`)
    }

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `2v2 reset.`);
    response.sendStatus(500);
  }
});


// Enable
app.get('/post/:channel/enable', jsonParser, async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.sendStatus(405);
      return;
    }
    
    let cookies = request.cookies;
    let rows;
    if (cookies["auth"]) {
      rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel && !rows[0].perms.split(',').includes(request.params.channel))) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    if (request.get('enabled') === userIds[request.params.channel].two_v_two) {
      response.sendStatus(201);
    } else {
      helper.dbQuery(`UPDATE allusers SET two_v_two = ${!userIds[request.params.channel].two_v_two}::bool WHERE user_id = '${request.params.channel}';`);

      userIds[request.params.channel].two_v_two = !userIds[request.params.channel].two_v_two;

      response.sendStatus(200);
    }
  } catch (err) {
    helper.dumpError(err, `2v2 enable.`);
    response.sendStatus(500);
  }
});


// Receive scores
app.get('/send/:channel/:hKills/:tKills/:o1Kills/:o2Kills', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.sendStatus(405);
      return;
    }
    let cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.sendStatus(401);
        return;
      }
    } else {
      response.sendStatus(401);
      return;
    }

    await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.hKills}, tkills = ${request.params.tKills}, o1kills = ${request.params.o1Kills}, o2kills = ${request.params.o2Kills}, tname = '${request.get('tname')}', o1name = '${request.get('o1name')}', o2name = '${request.get('o2name')}', mapreset = ${parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.params.channel}';`);
    await tvtscores(request.params.channel.toLowerCase());

    if (request.get('tstatus') === 'true' && userIds[request.get('tname')] && userIds[request.get('tname')]["two_v_two"] && rows[0].perms.split(',').includes(request.get('tname'))) {
      await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.tKills}, tkills = ${request.params.hKills}, o1kills = ${request.params.o1Kills}, o2kills = ${request.params.o2Kills}, mapreset = ${parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.get('tname')}';`)
      await tvtscores('' + request.get('tname'));
    }
    if (request.get('o1status') === 'true' && userIds[request.get('o1name')] && userIds[request.get('o1name')]["two_v_two"] && rows[0].perms.split(',').includes(request.get('o1name'))) {
      await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.o1Kills}, tkills = ${request.params.o2Kills}, o1kills = ${request.params.hKills}, o2kills = ${request.params.tKills}, mapreset = ${-1*parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.get('o1name')}';`)
      await tvtscores('' + request.get('o1name'));
    }
    if (request.get('o2status') === 'true' && userIds[request.get('o2name')] && userIds[request.get('o2name')]["two_v_two"] && rows[0].perms.split(',').includes(request.get('o2name'))) {
      await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.o2Kills}, tkills = ${request.params.o1Kills}, o1kills = ${request.params.hKills}, o2kills = ${request.params.tKills}, mapreset = ${-1*parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.get('o2name')}';`)
      await tvtscores('' + request.get('o2name'));
    }


    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `2v2 send scores.`);
    response.sendStatus(500);
  }
});


// Wins for c_o_l_e
app.get('/wins/:user', async (request, response) => {
  try {
    let data = await lifetime(encodeURIComponent(request.params.user), 'uno');
    response.send(`I got ${data.lifetime.mode.br.properties.wins} dubskies!`);
  } catch (err) {
    helper.dumpError(err, `Wins web.`);
  }
});


// API endpoint to format ban statements for accounts in BrookeAB's chat which were created and followed within 6 hours.
app.get('/brookescribers', async (request, response) => {
  try {
    let time = Math.round(Date.now() / 1000) - 10800;

    // Pull accounts from database.
    let rows = await helper.dbQueryPromise(`SELECT * FROM brookescribers ORDER BY followed_at DESC;`);

    if (rows.length > 100) {
      rows = await helper.dbQueryPromise(`SELECT * FROM brookescribers WHERE followed_at > ${time} ORDER BY followed_at DESC;`);
    }

    // Format string of ban statements.
    let str = '';
    for (let i = 0; i < rows.length; i++) {
      str += `/ban ${rows[i].user_id} <br/>`;
    }

    // Return response.
    response.send(`${str===''?'None':str}`);

  } catch (err) {
    helper.dumpError(err, `Brookescribers web.`);
    response.send(`/w zHekLeR Error during brookescribers @ ${Date.now()}`);
  }
});


// Get user's stats.
app.get('/stats/:id', async (req, response) => {
  try {
    response.send(await stats(req.params.id, 'uno'));
  } catch (err) {
    helper.dumpError(err, `Semtex.`);
    response.send(`Error while getting stats.`)
  }
});


function addEnd(placement) {
  placement = parseInt(placement);
  if (placement > 3 && placement < 21) {
    placement = `${placement}th`;
  } else if (`${placement}`.charAt(`${placement}`.length - 1) === '1') {
    placement = `${placement}st`;
  } else if (`${placement}`.charAt(`${placement}`.length - 1) === '2') {
    placement = `${placement}nd`;
  } else if (`${placement}`.charAt(`${placement}`.length - 1) === '3') {
    placement = `${placement}rd`;
  } else {
    placement = `${placement}th`;
  }
  return placement;
}


// Custom tourney page.
app.get ('/customs/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.sendStatus(405);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    let page = fs.readFileSync('./html/customs.html').toString('utf-8');
    page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);
    page = page.replace(/#channel#/g, userIds[request.params.channel].user_id);

    let rows = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${request.params.channel}';`);

    let multis = [];
    if (!rows || !rows.length) {
      multis.push('Multipliers not defined. Please use the !setmultipliers command in chat.');
    } else {
      let raw = rows[0].multipliers.split(' ');
      for (let i = 0; i < raw.length/2; i++) {
        let temp = '';
        if (i + 1 >= raw.length/2) {
          temp = `${addEnd(raw[2*i])}+ : ${raw[2*i + 1]}x`;
        } else if (parseInt(raw[2*i]) + 1 === parseInt(raw[2*i + 2])) {
          temp = `${addEnd(raw[2*i])} : ${raw[2*i + 1]}x`;
        } else {
          temp = `${addEnd(raw[2*i])}-${addEnd(parseInt(raw[2*i + 2]) - 1)} : ${raw[2*i + 1]}x`;
        }
        multis.push(temp);
      }
    }

    page = page.replace(/#multipliers#/g, multis.join('<br>'));
    response.send(page);
  } catch (err) {
    helper.dumpError(err, `Customs scores.`);
    response.send(err.message);
  }
});


let customCd = {};


// Custom tourney update.
app.get ('/customs/update/:channel', async (request, response) => {
  request.params.channel = request.params.channel.toLowerCase();
  try {
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.sendStatus(405);
      return;
    }
    
    let cookies = request.cookies;
    if (cookies["auth"]) {
      let rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE bearer = '${cookies["auth"]}';`);
      if (!rows.length || (rows[0].userid !== request.params.channel.toLowerCase() && !rows[0].perms.split(',').includes(request.params.channel.toLowerCase()))) {
        response.status(401);
        return;
      }
    } else {
      response.status(401);
      return;
    }

    if (customCd[request.params.channel] && customCd[request.params.channel] > (Date.now()/1000)) {
      response.sendStatus(201);
      return;
    } else {
      customCd[request.params.channel] = (Date.now()/1000) + 3;
    }

    let rows = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${request.params.channel}';`);

    let hKills = parseInt(request.get('hkills') || '0');
    let tKills = parseInt(request.get('tkills') || '0');
    let o1Kills = parseInt(request.get('o1kills') || '0');
    let o2Kills = parseInt(request.get('o2kills') || '0');
    let kills = hKills + tKills + o1Kills + o2Kills;

    let multis = rows[0].multipliers.split(' '), place = request.get('place') || '', placement = 0;
    for (let j = multis.length/2; j >= 0; j--) {
      
      if (parseInt(place) >= parseInt(multis[2*j])) {
        placement = parseFloat(multis[(2*j)+1]);
        break;
      }
    }

    
    say(request.params.channel, `Current Map | Kills: ${kills} | Score: ${(kills * placement).toFixed(2)}`);
    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Customs web page.`);
    response.send(err.message);
  }
});


// Get user's stats.
async function stats(username, platform) {
  try {
    let uriUser = encodeURIComponent(username);
    let time, lk, wk, wins, kills;

    let rows = await helper.dbQueryPromise(`SELECT * FROM stats WHERE acti_id = '${username}';`);

    if (!rows || !rows.length || rows[0].timeout < Date.now()/1000) {

      // Get stats.
      let data = await lifetime(uriUser, platform);

      if (data === 'Not permitted: not allowed') {
        return 'Account is private.';
      } 

      // Format stats.
      time = (data.lifetime.mode.br.properties.timePlayed/3600).toFixed(2);
      lk = data.lifetime.mode.br.properties.kdRatio.toFixed(2);
      wk = data.weekly.mode.br_all?data.weekly.mode.br_all.properties.kdRatio.toFixed(2):'-';
      wins = data.lifetime.mode.br.properties.wins;
      kills = data.lifetime.mode.br.properties.kills;

      // Cache in database.
      helper.dbQuery(`INSERT INTO stats(acti_id, time_played, life_kd, weekly_kd, wins, kills, timeout) VALUES ('${username}', ${time}, ${lk}, ${wk==='-'?0:wk}, ${wins}, ${kills}, ${(Date.now()/1000) + 3600})
        ON CONFLICT (acti_id) DO UPDATE SET time_played = ${time}, life_kd = ${lk}, weekly_kd = ${wk==='-'?0:wk}, wins = ${wins}, kills = ${kills}, timeout = ${(Date.now()/1000) + 3600};`);

    } else {
      time = rows[0].time_played;
      lk = rows[0].life_kd;
      wk = rows[0].weekly_kd?rows[0].weekly_kd:'-';
      wins = rows[0].wins;
      kills = rows[0].kills;
    }

    // Return response.
    return `${username} | Time Played: ${time} Hours | Lifetime KD: ${lk} | Weekly KD: ${wk} | Total Wins: ${wins} | Total Kills: ${kills}`;

  } catch (err) {
    helper.dumpError(err, `Stats.`);
    return err.toString().includes('not allowed')?'Permissions issue.':err.toString().includes('found')?'Account not found.':'Error getting stats.';
  }
};


// Get user's last match info.
async function lastGame(username) { 
  try {
    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' ORDER BY timestamp DESC LIMIT 1;`);
    
    // If rows are empty, return.
    if (!rows.length) {
      console.log('No matches found.')
      return 'No matches found.';
    }

    // Get match object.
    let match = rows[0];

    // Format teammates, if any.
    let teammates = ' | Teammates: ';
    if (!match.teammates.length) teammates += '-';
    for (let i = 0; i < match.teammates.length; i++) { teammates += (!i?'':' | ') + `${match.teammates[i].name} (${match.teammates[i].kills}K, ${match.teammates[i].deaths}D)`; }
    
    // Return response.
    return `${match.game_mode} | Lobby KD: ${match.lobby_kd?match.lobby_kd.toFixed(2):'-'} | ${match.placement} place | ${userIds[username].pref_name} (${match.kills}K, ${match.deaths}D) | Gulag: ${match.gulag_kills?'Won':match.gulag_deaths?'Lost':'-'} ${teammates}`;

  } catch (err) {
    helper.dumpError(err, `Last game.`);
    return '';
  }
};


// Get user's weekly stats.
async function lastGames(username) {
  try {
    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}';`);

    // Base values.
    let kGame = 0;
    let dGame = 0;
    let wins = 0;
    let streak = 0;
    let gulag_kills = 0;
    let gulag_deaths = 0;
    let lobby_kd = 0;
    let total = 0;

    // Increment stats.
    for (let i = 0; i < rows.length; i++) {
      kGame += rows[i].kills;
      dGame += rows[i].deaths;
      wins += rows[i].placement === "1st"?1:0;
      streak = rows[i].streak > streak?rows[i].streak:streak;
      gulag_kills += rows[i].gulag_kills;
      gulag_deaths += rows[i].gulag_deaths;
      lobby_kd += rows[i].lobby_kd;
      total += rows[i].lobby_kd?1:0;
    }
    
    // Return response.
    return `Weekly Stats | ${rows.length} Games | Avg Lobby KD: ${total?(lobby_kd/total).toFixed(2):'-'} | Kills/Game: ${rows.length?(kGame/rows.length).toFixed(2):'-'} | Deaths/Game: ${rows.length?(dGame/rows.length).toFixed(2):'-'} | K/D: ${dGame?(kGame/dGame).toFixed(2):'-'} | Wins: ${rows.length?wins:'-'} | Longest Kill Streak: ${rows.length?streak:'-'} | Gulag: ${rows.length?String(gulag_kills) + ' / ' + String(gulag_deaths):'-'}`;

  } catch (err) {
    helper.dumpError(err, `Weekly.`);
    return '';
  }
};


// Get the user's daily stats.
async function daily(username) {
  try {
    // Midnight of current day.
    let midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight};`);

    // Base values.
    let dailyGames = 0;
    let kGame = 0;
    let dGame = 0;
    let wins = 0;
    let streak = 0;
    let gulag_kills = 0;
    let gulag_deaths = 0;
    let lobby_kd = 0;
    let total = 0;

    // Increment stats.
    for (let i = 0; i < rows.length; i++) {
      dailyGames++;
      kGame += rows[i].kills;
      dGame += rows[i].deaths;
      wins += rows[i].placement === "1st"?1:0;
      streak = rows[i].streak > streak?rows[i].streak:streak;
      gulag_kills += rows[i].gulag_kills;
      gulag_deaths += rows[i].gulag_deaths;
      lobby_kd += rows[i].lobby_kd;
      total += rows[i].lobby_kd?1:0;
    }

    // Return response.
    return `Daily Stats | Games: ${dailyGames} | Avg Lobby KD: ${total?(lobby_kd/total).toFixed(2):'-'} | Kills/Game: ${dailyGames?(kGame/dailyGames).toFixed(2):'-'} | Deaths/Game: ${dailyGames?(dGame/dailyGames).toFixed(2):'-'} | K/D: ${dGame?(kGame/dGame).toFixed(2):kGame?kGame:'-'} | Wins: ${wins} | Longest Kill Streak: ${streak} | Gulag: ${rows.length?String(gulag_kills) + ' / ' + String(gulag_deaths):'-'}`;

  } catch (err) {
    helper.dumpError(err, `Daily.`);
    return '';
  }
};


// Get the user's 'bombs' for the day (30+ kill games).
async function bombs(username) {
  try {
    // Midnight of current day.
    let midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight} AND kills > ${userIds[username].bomb};`);

    // Base object.
    let bombs = [];

    // Increment stats.
    for (let i = 0; i < rows.length; i++) {
      bombs.push(rows[i].kills);
    }

    // Return response.
    return `${userIds[username].pref_name} has dropped ${bombs.length} bomb${bombs.length==1?'':'s'} (${userIds[username].bomb}+ kill games) today ${bombs.length?'('+bombs.join('K, ')+'K)':''}`;

  } catch (err) {
    helper.dumpError(err, `Bombs.`);
    return '';
  }
};


// Get the user's wins for the day.
async function wins(username) {
  try {
    // Midnight of current day.
    let midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight};`);

    // Base object.
    let wins = [];

    // Increment stats.
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].placement === '1st') wins.push(rows[i].kills);
    }

    // Return response.
    return `${userIds[username].pref_name} has won ${wins.length} game${wins.length==1?'':'s'} today ${wins.length?'(' + wins.join('K, ') + 'K)':''}`;

  } catch (err) {
    helper.dumpError(err, `Wins.`);
    return '';
  }
};


// Get user's gulag stats for the day.
async function gulag(username) {
  try {
    // Midnight of current day.
    let midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight};`);

    // Base values.
    let gulag_kills = 0;
    let gulag_deaths = 0;

    // Increment stats.
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].gulag_kills) { 
        gulag_kills++;
      } else if (rows[i].gulag_deaths) {
        gulag_deaths++;
      } 
    }

    // Return response.
    return `${userIds[username].pref_name} has ${gulag_kills} win${gulag_kills==1?'':'s'} and ${gulag_deaths} loss${gulag_deaths==1?'':'es'} in the gulag today.`;

  } catch (err) {
    helper.dumpError(err, `Gulag.`);
    return '';
  }
};


// Function to get user's frequent teammates.
async function teammates(username) {
  try {
    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${username}';`);

    let teammates = new Map();

    for (let i = 0; i < rows.length; i++) {
      let team = rows[i].teammates;
      if (!team.length) continue;

      for (let j = 0; j < team.length; j++) {
        let keyValue = teammates.get(team[j].name);
        teammates.set(team[j].name, keyValue?keyValue + 1:1);
      }
    }
    
    let sorted = Array.from(teammates.keys()).sort((a, b) => teammates.get(b) - teammates.get(a));
    
    let retStr = `Weekly Teammates | `;
    for (let i = 0; i < (sorted.length < 5?sorted.length:5); i++) {
      retStr += `${sorted[i]}: ${teammates.get(sorted[i])} games${i == 4 || i + 1 == sorted.length?'':' | '}`;
    }
    
    return retStr;
  } catch (err) {
    helper.dumpError(err, `Teammates.`);
    return '';
  }
};


// Function to get user's frequent teammates.
async function gamemodes(username) {
  try {
    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${username}';`);

    let gamemodes = new Map();

    for (let i = 0; i < rows.length; i++) {
      let mode = rows[i].game_mode;

      let keyValue = gamemodes.get(mode);
      gamemodes.set(mode, keyValue?keyValue + 1:1);
    }
    
    let sorted = Array.from(gamemodes.keys()).sort((a, b) => gamemodes.get(b) - gamemodes.get(a));
    
    let retStr = `Weekly Game Modes | `;
    for (let i = 0; i < (sorted.length < 5?sorted.length:5); i++) {
      retStr += `${sorted[i]}: ${gamemodes.get(sorted[i])} games${i == 4 || i + 1 == sorted.length?'':' | '}`;
    }
    
    return retStr;
  } catch (err) {
    helper.dumpError(err, `Game modes.`);
    return '';
  }
};


// Win streak.
async function streak(username) {
  try {
    let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' ORDER BY timestamp DESC;`);

    let wins = 0, x = 0;
    while (x < rows.length) {
      if (rows[x].placement === '1st') {
        wins++;
      } else break;
      x++;
    }

    return `${userIds[username].pref_name} is currently on a ${wins} win streak`;
  } catch (err) {
    helper.dumpError(err, `Streak.`);
    return '';
  }
};


// Pull number of semtex kills from COD API - only for HusK currently.
async function semtex() {
  try {
    let data = await lifetime('HusKerrs', 'uno');
    let semtex = data.lifetime.itemData.lethals['equip_semtex'].properties.kills;
    return `${semtex} kills with semtex huskKing`;
  } catch (err) {
    helper.dumpError(err, `Semtex.`);
    return '';
  }
};


// Wordle!
app.get('/wordle/:id', async (req, response) => {
  try {
    response.send(await wordle.wordleStart(req.params.id));
  } catch (err) {
    helper.dumpError(err, `Error Wordle overall.`);
    response.send(`Error during Wordle`);
  }
});


// Give up on the Wordle.
app.get('/wordlesux/:id', async (req, response) => {
  try {
    response.send(await wordle.wordleSux(req.params.id));
  } catch (err) {
    helper.dumpError(err, `Error getting Wordle deleting.`);
    response.send(`Error during !wordlesux`);
  }
});


// Wordle guess.
app.get('/wordle/:id/:guess', async (req, response) => {
  try {
    response.send(await wordle.wordleGuess(req.params.id, req.params.guess));
  } catch (err) {
    helper.dumpError(err, `Error getting Wordle guess.`);
    response.send(`Error during !wordleguess`);
  }
});


// Wordle past guesses.
app.get('/wordleguesses/:id', async (req, response) => {
  try {
    response.send(await wordle.wordleGuesses(req.params.id));
  } catch (err) {
    helper.dumpError(err, `Error getting Wordle guesses.`);
    response.send(`Error getting past guesses.`);
  }
});


// Wordle stats.
app.get('/wordlestats/:id', async (req, response) => {
  try {
    response.send(await wordle.wordleStats(req.params.id));
  } catch (err) {
    helper.dumpError(err, `Error getting Wordle stats.`);
    response.send(`Error while getting Wordle stats.`);
  }
});


// Wordle leaderboard!


app.get('/wordlelb', async (req, response) => {
  try {
    response.send(await wordle.wordleLb());
  } catch (err) {
    helper.dumpError(err, `Error getting Wordle leaderboard.`);
    response.send(`Error getting Wordle leaderboard.`);
  }
});


app.get('/twitch/redirect', async (req, response) => {
  try {
    let query = url.parse(req.url, true).query;
    let code = query["code"];

    await axios.post(`https://id.twitch.tv/oauth2/token`,
    `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=https://localhost:6969/redirect`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(async resp => {
      let data = resp.data;

      await axios.get('https://id.twitch.tv/oauth2/validate',
      {
        headers: {
          'Authorization': 'OAuth ' + data.access_token
        }
      }).then(async resp2 => {
        let data2 = resp2.data;

        helper.dbQuery(`INSERT INTO access_tokens(userid, access_token, refresh_token, scope) 
          VALUES ('${data2.login}', '${data.access_token}', '${data.refresh_token}', '${data2.scopes.join(', ')}')
          ON CONFLICT (userid) DO UPDATE SET access_token = '${data.access_token}', refresh_token = '${data.refresh_token}', scope = '${data2.scopes.join(', ')}';`);
      }).catch(err => {
        helper.dumpError(err, "Twitch redirect validate.");
      });
    }).catch(err => {
      helper.dumpError(err, "Twitch redirect token.");
    });

    response.redirect('/');
  } catch (err) {
    helper.dumpError(err, "Twitch redirect overall.");
    response.redirect('/');
  }
})


// Default not found page.
app.get("*", (req, response) => {
  response.status(404);
  let page = fs.readFileSync("./html/not_found.html").toString('utf-8');
  if (req.cookies["auth"]) {
    page = page.replace('Login to Twitch', 'Logout of Twitch');
  }
  response.send(page);
});


// Pull all matches in the last week.
async function weekMatches(userid) {
  try {
    let matches = [];

    let timestamp = parseInt((await helper.dbQueryPromise(`SELECT MIN(timestamp) FROM matches WHERE user_id = '${userIds[userid].acti_id}';`))[0].min) || DateTime.now().toSeconds();
    let weekAgo = DateTime.now().minus({weeks:1}).toSeconds() + userIds[userid].time_offset || DateTime.now().minus({weeks:1}).toSeconds();

    while (timestamp > weekAgo) {
      let data = (await date20(encodeURIComponent(userIds[userid].acti_id), userIds[userid].platform, timestamp)).matches;
      for (let i = 0; i < data.length; i++) {
        timestamp = data[i].utcStartSeconds; 
        if (timestamp < weekAgo) break;

        matches.push(data[i]);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await update(matches, userIds[userid], 0);
    console.log(`Updated all matches for ${userid}.`);
  } catch (err) {
    helper.dumpError(err, 'Week Matches.');
  }
};


// Pull matches from codtracker between every 5 and store in database.
async function updateMatches() {
  idArray = [];
  try {
    let onTwitch = await helper.dbQueryPromise(`SELECT * FROM allusers WHERE matches = true;`);
    for (let i = 0; i < onTwitch.length; i++) {
      if (userIds[onTwitch[i].user_id].matches && userIds[onTwitch[i].user_id].twitch && onTwitch[i].user_id !== 'zhekler' && (!online[onTwitch[i].user_id] || Date.now() > online[onTwitch[i].user_id])) {
        setTimeout(async () => {
          try {
            // Get time from a week ago and set base timestamp.
            console.log("Updating matches for " + userIds[onTwitch[i].user_id].acti_id);
            
            let weekAgo = (DateTime.now().minus({weeks:1}).toSeconds() + userIds[onTwitch[i].user_id].time_offset) || DateTime.now().minus({weeks:1}).toSeconds();
            let lastTimestamp = 0;
            
            // Clear matches which are older than a week.
            helper.dbQuery(`DELETE FROM matches WHERE timestamp < ${weekAgo} AND user_id = '${onTwitch[i].acti_id}';`);
            
            // If match cache for this user is empty, set it.
            let rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[onTwitch[i].user_id].acti_id}' ORDER BY timestamp DESC;`);
            
            // Update timestamp of last match.
            lastTimestamp = rows.length?rows[0].timestamp:lastTimestamp;
            
            // Fetch last 20 matches for user from COD API.
            let data;
            try { 
              data = await last20(encodeURIComponent(userIds[onTwitch[i].user_id].acti_id), userIds[onTwitch[i].user_id].platform); 
              if (!data) throw new Error('Matches undefined.');
              await update(data.matches, userIds[onTwitch[i].user_id], lastTimestamp);
              
              // Get stats for each match and push to database.
              console.log(`Updated matches for ${userIds[onTwitch[i].user_id].acti_id}.`);
            }
            catch (err) { setTimeout(async () => { 
              try { 
                helper.dumpError(err, `Error: ${userIds[onTwitch[i].user_id].acti_id}, retrying.`); 
                data = await last20(encodeURIComponent(userIds[onTwitch[i].user_id].acti_id), userIds[onTwitch[i].user_id].platform); 
                await update(data.matches, userIds[onTwitch[i].user_id], lastTimestamp); 

                // Get stats for each match and push to database.
                console.log(`Updated matches for ${userIds[onTwitch[i].user_id].acti_id}.`);
              } 
              catch (err) { helper.dumpError(err, `Error during retry.`) } 
            }, 20000); }

          
          } catch (err) {
            helper.dumpError(err, `Updating matches.`);
            return; 
          }
        }, i*10000);
        if (!userIds[onTwitch[i].user_id].online && (!online[onTwitch[i].user_id] || Date.now() > online[onTwitch[i].user_id])) {
          online[onTwitch[i].user_id] = Date.now() + 1000*60*60;
        }
      }
    }

  } catch (err) {
    helper.dumpError(err, `Error while updating matches.`);
  }
};


// Pick the stats out of the matches.
async function update(matches, user, lastTimestamp) {
  try {

    // Declarations and base values.
    let timestamp, match_id, placement, kills, deaths, lobby_kd, game_mode;
    let gulag_kills = 0;
    let gulag_deaths = 0;
    let streak = 0;
    let addStr = [];

    if (!matches) return;
    for (let i = 0; i < matches.length; i++) {

      let data = (await apiAxios.get(`https://app.wzstats.gg/v2/?matchId=${matches[i].matchID}`)).data;
      lobby_kd = data.matchStatData.playerAverage?data.matchStatData.playerAverage:0;

      timestamp = matches[i].utcStartSeconds;
      if (timestamp <= lastTimestamp) continue;
      
      // Get match ID.
      match_id = matches[i].matchID;
            
      // Set placement.
      placement = String(matches[i].playerStats.teamPlacement) || '';
      
      if (!placement) {
        placement = "-";
      } else {
        if (placement.length >= 2 && placement.charAt(placement.length - 2) === '1') {
          placement += 'th';
        } else {
          placement += placement.charAt(placement.length - 1)==='1'?'st':placement.charAt(placement.length - 1)==='2'?'nd':placement.charAt(placement.length - 1)==='3'?'rd':'th';
        }
      }
      if (placement.includes('undefined')) placement = "-";
      
      // Set kills and deaths.
      kills = matches[i].playerStats.kills;
      deaths = matches[i].playerStats.deaths;
      
      // Set game mode.
      game_mode = Object.keys(game_modes).includes(matches[i].mode)?game_modes[matches[i].mode]:matches[i].mode;

      // Set gulag stats.
      gulag_kills = 0;
      gulag_deaths = 0;
      if (!game_mode.includes('Resurgence') && !game_mode.includes('Rebirth') && !game_mode.includes('respect') && !game_mode.includes('Champion') && !game_mode.includes('Fortune') && !game_mode.includes('Buy Back') && !game_mode.includes('Iron Trial')) {
        if (matches[i].playerStats.gulagKills) {
          gulag_kills = 1;
        } else if (matches[i].playerStats.gulagDeaths) {
          gulag_deaths = 1;
        }
      }
      
      // Get all players for this match.
      let players = data.data.players || [];
      
      // Find user's team name.
      let teamName = '';
      for (let j = 0; j < players.length; j++) {
        if (players[j].playerMatchStat.player.uno === user.uno_id) {
          teamName = players[j].playerMatchStat.player.team;
          break;
        }
      }
      
      // Teammates?
      let teammates = [];
      for (let j = 0; j < players.length; j++) {
        if (players[j].playerMatchStat.player.team === teamName && players[j].playerMatchStat.player.uno !== user.uno_id) {
          let player = { 
            name: players[j].playerMatchStat.player.username, 
            kills: players[j].playerMatchStat.playerStats.kills, 
            deaths: players[j].playerMatchStat.playerStats.deaths 
          };
          teammates.push(player);
          if (teammates.length == 3) break;
        }
      }

      // Replace longest streak?
      streak = matches[i].playerStats.longestStreak || 0;

      // Add match stats to cache and prepare them for insertion into the database.
      addStr.push(`(${timestamp}, '${match_id}', '${placement}', ${kills}, ${deaths}, ${gulag_kills}, ${gulag_deaths}, ${streak}, ${lobby_kd}, '${JSON.stringify(teammates)}'::json, '${game_mode}', '${user.acti_id}')`);
    }

    // If no new matches, just return.
    if (!addStr || !addStr.length) return;

    // Insert new matches into database.
    helper.dbQuery(`INSERT INTO matches(timestamp, match_id, placement, kills, deaths, gulag_kills, gulag_deaths, streak, lobby_kd, teammates, game_mode, user_id) VALUES ${addStr.join(', ')};`);

  } catch (err) {
    helper.dumpError(err, `Error in update function.`);
  }
};

// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();

// Notification message types
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification';
const MESSAGE_TYPE_NOTIFICATION = 'notification';
const MESSAGE_TYPE_REVOCATION = 'revocation';

// Prepend this string to the HMAC that's created from the message
const HMAC_PREFIX = 'sha256=';

// Message IDs.
let idArray = [], intArray = {};


app.post('/eventsub', (req, res) => {
  let secret = getSecret();
  let message = getHmacMessage(req);
  let hmac = HMAC_PREFIX + getHmac(secret, message);  // Signature to compare

  if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {

    // Get JSON object from body, so you can process the message.
    let notification = req.body;
    
    if (idArray.includes(req.get(TWITCH_MESSAGE_ID))) {
      console.log("Duplicate event message.");
      res.send(201);
    } else if (new Date(TWITCH_MESSAGE_TIMESTAMP).getTime() + 10*60*1000 < Date.now()) {
      console.log("Expired event message.");
      res.send(202);
    } else {
      idArray.push(req.get(TWITCH_MESSAGE_ID));
      if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
        let pred;
        switch (notification.subscription.type) {
          case "channel.prediction.begin":
            pred = notification.event.title;
            let time = ((new Date(notification.event.locks_at)).getTime() - (new Date(notification.event.started_at)).getTime())/1000;
            say(notification.event.broadcaster_user_login, `NEW PREDICTION peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time} SECONDS peepoGamble DinkDonk 
              NEW PREDICTION peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time} SECONDS`);
            if (time >= 60) {
              intArray[notification.event.broadcaster_user_login] = setTimeout(function () { 
                say(notification.event.broadcaster_user_login, `GET YOUR BETS IN peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time/2} SECONDS peepoGamble DinkDonk 
                GET YOUR BETS IN peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time/2} SECONDS`); 
                delete intArray[notification.event.broadcaster_user_login];
              }, time*1000/2);
            }
            break;

          case "channel.prediction.end": 
            let outcome;
            for (let i = 0; i < notification.event.outcomes.length; i++) {
              if (notification.event.winning_outcome_id === notification.event.outcomes[i].id) {
                outcome = notification.event.outcomes[i];
                break;
              }
            }
            if (outcome) {
              let result = outcome.title;
              let topBetter = outcome.top_predictors[0];
              say(notification.event.broadcaster_user_login, `Prediction over! The result was '${result}'! ${topBetter.user_name?topBetter.user_name:topBetter.user_login} won ${topBetter.channel_points_won} points!`);
            } else {
              if (intArray[notification.event.broadcaster_user_login]) {
                clearInterval(intArray[notification.event.broadcaster_user_login]);
                delete intArray[notification.event.broadcaster_user_login];
              }
              say(notification.event.broadcaster_user_login, 'Prediction canceled! Points have been refunded.');
            }
            break;

          case "channel.prediction.lock":
            pred = notification.event.title;
            let points = 0;
            for (let i = 0; i < notification.event.outcomes.length; i++) {
              points += notification.event.outcomes[i].channel_points?notification.event.outcomes[i].channel_points:0;
            }
            if (intArray[notification.event.broadcaster_user_login]) {
              clearInterval(intArray[notification.event.broadcaster_user_login]);
              delete intArray[notification.event.broadcaster_user_login];
            }
            say(notification.event.broadcaster_user_login, `Prediction locked! There are ${points} points on the line for '${pred}'`);
            break;

          case "stream.online":
            userIds[notification.event.broadcaster_user_login].online = true;
            helper.dbQuery(`UPDATE allusers SET online = true::bool WHERE user_id = '${notification.event.broadcaster_user_login}';`);
            if (online[notification.event.broadcaster_user_login]) delete online[notification.event.broadcaster_user_login];
            break;

          case "stream.offline":
            userIds[notification.event.broadcaster_user_login].online = false;
            helper.dbQuery(`UPDATE allusers SET online = false::bool WHERE user_id = '${notification.event.broadcaster_user_login}';`);
            break;

          default: 
            console.log(`Unknown event: ${notification.subscription.type}`);
            break;
        }

        console.log(`Event type: ${notification.subscription.type} for channel ${notification.event.broadcaster_user_login}.`);
        res.setHeader('Content-Type', 'text/html').sendStatus(204);
      }
      else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
        res.setHeader('Content-Type', 'text/html').status(200).send(notification.challenge);
      }
      else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
        res.setHeader('Content-Type', 'text/html').sendStatus(204);

        console.log(`${notification.subscription.type} notifications revoked!`);
        console.log(`reason: ${notification.subscription.status}`);
        console.log(`condition: ${JSON.stringify(notification.subscription.condition, null, 4)}`);
      }
      else {
        res.setHeader('Content-Type', 'text/html').sendStatus(204);
        console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
      }
    }
  }
  else {
    console.log('403');    // Signatures didn't match.
    res.setHeader('Content-Type', 'text/html').sendStatus(403);
  }
})


function getSecret() {
  return process.env.SECRET;
}

// Build the message used to get the HMAC.
function getHmacMessage(request) {
  return `${request.headers[TWITCH_MESSAGE_ID]}${request.headers[TWITCH_MESSAGE_TIMESTAMP]}${JSON.stringify(request.body)}`;
}

// Get the HMAC.
function getHmac(secret, message) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// Verify whether your signature matches Twitch's signature.
function verifyMessage(hmac, verifySignature) {
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature));
}


// Intervals.
let intervals = [];


// Authenticate with Twitch API.
async function authenticate() {
  try {
    await symAxios.get('https://id.twitch.tv/oauth2/validate')
    .then(res => {
        intervals.push(setInterval(() => brookescribers(), 120000));
        console.log("Brookescribers");
    })
    .catch(err => {
      helper.dumpError(err, `Twitch Authenticate.`);
      if (JSON.stringify(err).includes('40')) {
        regenerate();

        if (intervals["brooke"]) {
          clearInterval(intervals["brooke"]);
        }
    
        intervals["brooke"] = setInterval(() => brookescribers(), 300000);
      }
    })
  } catch (err) {
    helper.dumpError(err, `Overall Twitch Auth.`); 
  }
}


// Regenerate Twitch API token.
function regenerate() {
  axios.post('https://id.twitch.tv/oauth2/token',
    `grant_type=refresh_token&refresh_token=${account_config.refresh_token}&client_id=${client_config.client_id}&client_secret=${client_config.client_secret}`,
    { 
      headers: { responseType: 'json' }
  })
  .then(resp => {
    console.log(resp.data);
    for (var k in resp.data) {
      account_config[k] = resp.data[k];
    }
    symAxios.defaults.headers.common["Authorization"] = "Bearer " + account_config.access_token;

    if (intervals["access_token"]) clearInterval(intervals["access_token"]);
    intervals["access_token"] = setInterval(function() {
      symAxios.get('https://id.twitch.tv/oauth2/validate', 
      {
        headers: {
          "Client-Id": process.env.CLIENT_ID || '',
          "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }).then(resp => {
          console.log(JSON.stringify(resp.data));
          if (resp.status && `${resp.status}`.includes('40')) {
            regenerate();
          }
      }).catch(err => {
          helper.dumpError(err, "Regenerate validate.");
      });
    }, 60*60*1000);

    console.log("Access token refreshed.");
  })
  .catch(err => {
    helper.dumpError(err, "Regenerate overall.");
  });
}


// Function to get accounts which created and followed BrookeAB within 6 hours ago.
async function brookescribers() {
  try {

    // Get Unix timestamp from 6 hours ago.
    
    let sixAgo = DateTime.now().setZone('America/Denver').minus({hours:6}).toMillis()/1000;

      // Get BrookeAB's last 20 followers.
      await symAxios.get('https://api.twitch.tv/helix/users/follows?to_id=214560121')
      .then(async resp => {
        try {
          // Pull most recent follower from database.
          helper.dbQuery(`DELETE FROM brookescribers WHERE created_at < ${sixAgo};`);
          let fRes = await helper.dbQueryPromise(`SELECT user_id FROM brookescribers;`);
          let fLast = []
          for (let i = 0; i < fRes.length; i++) fLast.push(fRes[i].user_id);

          // Set up temp storage.
          let temp = resp.data.data;
          let them = [];
          // Iterate through recent followers.
          for (let i = 0; i < temp.length; i++) {

            // If follower is more recent than those in the database and followed within six hours, check it's creation date.
            let followed = (new Date(temp[i].followed_at)).getTime()/1000;
            if (followed > sixAgo) {
              await symAxios.get(`https://api.twitch.tv/helix/users?id=${temp[i].from_id}`)
              .then(res2 => {
                if (res2.data.data[0]) {
                  let created = (new Date(res2.data.data[0].created_at)).getTime()/1000;
                  if (created > sixAgo && !fLast.includes(res2.data.data[0].login)) {
                    them.push(`('${res2.data.data[0].login}', ${followed}, ${created})`);
                  }
                } else {
                  console.log(`${temp[i].from_id}: ${res2.data}`);
                }
              })
              .catch(err => {
                helper.dumpError(err, "Brookescribers creation age.");
              });
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Add new followers to database.
          if (them.length) {
            helper.dbQuery(`INSERT INTO brookescribers (user_id, followed_at, created_at) VALUES ${them.join(', ')};`);
          }

          console.log("Updated Brookescribers.");
        } catch (err) {
          helper.dumpError(err, `Brookescribers user.`);
        }
      })
      .catch(err => {
        helper.dumpError(err, `Brookescribers get user.`);
      });
  } catch (err) {
    helper.dumpError(err, `Brookescribers overall.`);
  }
};


// Start'er'up
(async () => {
  try {
    
    // Start server.
    app.listen(process.env.PORT || 6969, function() {
      console.log("Server is listening.");
    });

    // Log into the COD API.
    await loginWithSSO(process.env.COD_SSO);

    // Populate match cache and initialize userIds map.
    let temp = await helper.dbQueryPromise(`SELECT * FROM allusers;`);
    for (let i = 0; i < temp.length; i++) {
      userIds[temp[i].user_id] = temp[i];
      if (temp[i].twitch) {
        // @ts-ignore
        bot.channels.push(temp[i].user_id);
        gcd[temp[i].user_id] = { };
      }
    };

    // Set the 5 minute interval for each player being tracked and get their active elements.
    intervals["matches"] = setInterval(async() => { 
      try { 
        await updateMatches();
      } catch (err) {
        console.log(`Match intervals: ${err}`);
      }
    }, 300000);

    setInterval(function() { duelExpiration(); }, 5000);
    
    // Connect to Twitch channels.
    await bot.connect()
    .catch(err => {
      helper.dumpError(err, "Twitch enable.");
    });

    // Authenticate with Twitch API and set 2 minute interval for BrookeAB's followers.
    await authenticate();

    // Hourly call to verify access token.
    intervals["access_token"] = setInterval(function() {
      symAxios.get('https://id.twitch.tv/oauth2/validate', 
      {
        headers: {
          "Client-Id": process.env.CLIENT_ID || '',
          "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }).then(resp => {
          console.log(JSON.stringify(resp.data));
          if (resp.status && `${resp.status}`.includes('40')) {
            regenerate();
          }
      }).catch(err => {
          helper.dumpError(err, "Hourly Twitch validation error.");
      });
    }, 60*60*1000);

  } catch (err) {

    // Clear intervals.
    for (let i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }

    // Log the error.
    helper.dumpError(err, "Everything error.");
  }
})();
