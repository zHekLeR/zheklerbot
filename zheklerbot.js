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
        var temp = message.content.substring(message.content.indexOf('/ban ') + 5).split(' '); 
        bot.ban('huskerrs', temp.splice(0, 1).toString(), temp.join(' ') + ' | Global ban')
        .catch(err => {
          helper.dumpError(err, "Global bans.");
        });
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
var rrcd = [], rpscd = [], cfcd = [], bvcd = [], dcd = [];

// Global cooldowns.
var gcd = { };

// Active elements for each user.
var userIds = {}, online = {};

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

// Twitch bots for scorekeeping.
var scoreBots = {};


/**
 * Handle chats to Twitch.
 * @param {string} channel
 * @param {string} message
 * @param {tmi.Client} chatBot
 */
function say(channel, message, chatBot) {
  if (profanity.isProfane(message)) {
    helper.dumpError(message, "Bot.say: channel " + channel);
    return;
  }
  chatBot.say(channel, message)
  .catch(err => {
    helper.dumpError(err, "Say: " + message);
  });
};

// Two vs Two arrays.
var tvtUpdate = {};

// Logs the Twitch bot being initialized.
bot.on('logon', () => {
  console.log("Twitch bot logged on.");
});

// Free trial up.
var pause = {};

// Tourney commands.
var tourneyComs = ["!mc", "!prize", "!status", "!bracket", "!banned", "!format"];

// Check for commands and respond appropriately.
bot.on('chat', async (channel, tags, message) => {
  try {

    // Return if not a command.
    if (message.charAt(0) !== '!') return;
    if (pause[channel.substring(1)] && tags["username"] !== 'zhekler') return;

    // Get command.
    var splits = message.split(' ');
    var short = splits[0].toLowerCase();

    // Is there a global command set for this chat?
    if (!gcd[channel.substring] || !gcd[channel.substring].length) {
      gcd[channel.substring(1)] = {};
    }

    // Check/set global cooldown on command.
    if (gcd[channel.substring(1)][short] && gcd[channel.substring(1)][short] > Date.now()) return;
    gcd[channel.substring(1)][short] = Date.now() + 2000;

    // Base values.
    var res = [], placement, kills, multis, score, str, rows;
    
    // Disabled commands.
    var coms = userIds[channel.substring(1)].disabled?userIds[channel.substring(1)].disabled.split(','):[];
    if (coms.includes(short)) return;

    // Switch on given command.
    switch (short) {
      
      /*####################################################################################################################
          Some run of the mill commands to set up zHekBot.
      ####################################################################################################################*/
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
        say(channel, `zHekBot commands: https://www.zhekbot.com/commands/${channel.substring(1)}`, bot);
        gcd[channel.substring(1)][short] = Date.now() + 10000;
        break;


      // Start timer.
      case '!starttimer':
        if (tags['username'] !== 'zhekler') break;
        if (!intArray[channel.substring(1)]) intArray[channel.substring(1)] = {};
        if (intArray[channel.substring(1)][splits[1]]) break;
        var time = parseInt(splits[2]);
        intArray[channel.substring(1)][splits[1]] = setInterval(function () {
          say(channel.substring(1), splits.slice(3).join(' '), bot);
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
        say(channel, 'The free trial for zHekBot has expired #payzhekler', bot);
        break;

      // Unpause.
      case '!unpause':
        if (tags["username"] !== 'zhekler' || !pause[channel.substring(1)]) break;
        pause[channel.substring(1)] = false;
        break;


      /*####################################################################################################################
        Commands for Revolver Roulette.
      ####################################################################################################################*/

      // Enable Revolver Roulette.
      case '!rron': 
        if (userIds[channel.substring(1)].revolverroulette || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET revolverroulette = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].revolverroulette = true;
        say(channel, `Revolver Roulette has been enabled. Type !rr to play!`, bot);
        break;

      // Disable Revolver Roulette.
      case '!rroff': 
        if (!userIds[channel.substring(1)].revolverroulette || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET revolverroulette = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].revolverroulette = false;
        say(channel, `Revolver Roulette has been disabled.`, bot);
        break;

      // Play Revolver Roulette.
      case '!rr': 
        if (!userIds[channel.substring(1)].revolverroulette) break;
        if (!bot.isMod(channel, 'zhekler')) {
          say(channel, 'Revolver Roulette is unavailable since the bot is not modded.', bot);
          userIds[channel.substring(1)].revolverroulette = false;
          helper.dbQuery(`UPDATE allusers SET revolverroulette = false::bool WHERE user_id = '${channel.substring(1)}';`);
        }
        if (!rrcd[tags["username"] || ''] || rrcd[tags["username"] || ''] < Date.now()) {
          rows = await revolverroulette.revolverroulette(tags["display-name"] || tags["username"] || '', channel);
          if (rows.error) {
            helper.dumpError(rows.error, "Revolver Roulette.");
          } else  if (rows.first) {
            say(channel.substring(1), `${tags["display-name"] || tags["username"]}: Revolver Roulette is a game where you have 1/3 chance to be timed out for 5 min. You have been warned.`, bot);
          } else if (rows.win) {
            say(channel, `${tags["display-name"] || tags["username"]} has survived RR! Their record is ${rows.user["survive"]} survivals and ${rows.user["die"]} deaths`, bot);
          } else {
            if (!tags["badges"]?.moderator) {
              bot.timeout(channel, tags["username"] || '', 300, `You lost RR! Your record is ${rows.user["survive"]} survivals and ${rows.user["die"]} deaths`)
              .catch(err => {
                console.log(err.message);
              });
              say(channel.substring(1), `${tags["username"]} lost Revolver Roulette!`, bot);
            } else {
              say(channel, `${rows.user.user_id} lost RR! L mod immunity. Their record is ${rows.user["survive"]} survivals and ${rows.user["die"]} deaths`, bot);
            }
          }
          rrcd[tags["username"] || ''] = Date.now() + 30000;
        }
        break;

      // Get this user's Revolver Roulette score.
      case '!rrscore':
      case '!rrstats':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteScore(tags["display-name"] || tags["username"] || '', channel), bot);
        break;

      // Get another user's Revolver Roulette score.
      case '!rrscoreother':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteScore(message.split(' ')[1], channel), bot);
        break;

      // Get the 3 users with the top survivals in Revolver Roulette.
      case '!rrlb':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLb(channel), bot);
        break;

      // Get the 3 users with the top deaths in Revolver Roulette.
      case '!rrlbdie':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLbDie(channel), bot);
        break;

      // Get the 3 users with the best win / loss ratios in Revolver Roulette.
      case '!rrlbratio':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLbRatio(channel), bot);
        break;

      // Get the 3 users with the worst win / loss ratios in Revolver Roulette.
      case '!rrlbratiolow':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteLbRatioLow(channel), bot);
        break;

      // Get the total survivals and deaths for this channel in Revolver Roulette.
      case '!rrtotals':
        if (!userIds[channel.substring(1)].revolverroulette) break;
        say(channel, await revolverroulette.revolverrouletteTotals(channel), bot);
        break;


      /*####################################################################################################################
        Commands for Coinflip.
      ####################################################################################################################*/

      // Enable Coinflip.
      case '!coinon':
        if (userIds[channel.substring(1)].coinflip || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET coinflip = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].coinflip = true;
        say(channel, `Coinflip enabled.`, bot);
        break;

      // Disable Coinflip.
      case '!coinoff':
        if (!userIds[channel.substring(1)].coinflip || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET coinflip = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].coinflip = false;
        say(channel, `Coinflip disabled.`, bot);
        break;

      // Play Coinflip.
      case '!coin':
        if (!userIds[channel.substring(1)].coinflip || splits.length < 2) break;
        if (!cfcd[tags["username"] || ''] || cfcd[tags["username"] || ''] < Date.now()) {
          rows = await coinflip.coinflip(tags["display-name"]?tags["display-name"]:tags["username"], message.split(' ')[1], channel);
          if (!rows.input) {
            say(channel.substring(1), `Proper input is: !rps [ rock, paper, scissors, r, p, s ]`, bot);
          } else if (rows.err) {
            helper.dumpError(rows.err, "Coinflip.");
          } else {
            if (rows.correct) {
              say(channel.substring(1), `${rows.user.user_id} guessed correctly! Their record is ${rows.user.correct} correct and ${rows.user.wrong} wrong.`, bot);
            } else {
              if (bot.isMod(channel, 'zhekler') && !bot.isMod(channel, tags["username"] || '')) {
                bot.timeout(channel.substring(1), `${tags["username"]}`, userIds[channel.substring(1)].timeout, `You guessed wrong! Your record is ${rows.user.correct} correct and ${rows.user.wrong} wrong.`)
                .catch(err => {
                  console.log(err.message);
                });
                say(channel.substring(1), `${rows.user.user_id} lost Coinflip!`, bot);
              } else {
                say(channel, `You guessed wrong! Your record is ${rows.user.correct} correct and ${rows.user.wrong} wrong.`, bot);
              }
            }
          }
          rrcd[tags["username"] || ''] = Date.now() + 15000;
        }
        break;

      // Get this user's score in Coinflip. 
      case '!coinscore':
      case '!coinstats':
        if (!userIds[channel.substring(1)].coinflip) break;
        say(channel, await coinflip.coinflipScore(tags["display-name"]?tags["display-name"]:tags["username"], channel), bot);
        break;

      // Get the users with the most wins and the most losses in Coinflip. 
      case '!coinlb':
        if (!userIds[channel.substring(1)].coinflip) break;
        say(channel, await coinflip.coinflipLb(channel), bot);
        break;


      /*####################################################################################################################
        Commands for Rock Paper Scissors.
      ####################################################################################################################*/

      // Enable Rock Paper Scissors.
      case '!rpson':
        if (userIds[channel.substring(1)].rps || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET rps = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].rps = true;
        say(channel, `Rock paper scissors enabled.`, bot);
        break;

      // Disable Rock Paper Scissors.
      case '!rpsoff':
        if (!userIds[channel.substring(1)].rps || !tags["mod"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET rps = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].rps = false;
        say(channel, `Rock paper scissors disabled.`, bot);
        break;

      // Play Rock Paper Scissors.
      case '!rps': 
        if (!userIds[channel.substring(1)].rps || splits.length < 2) break;
        if (!rpscd[tags["username"] || ''] || rpscd[tags["username"] || ''] < Date.now()) {
          rows = await rps.rps(tags["display-name"]?tags["display-name"]:tags["username"], splits[1], channel);
          if (rows.error) {
            helper.dumpError(rows.error, "Rock Paper Scissors.");
          } else if (!rows.input) {
            say(channel.substring(1), 'Proper input is !rps [ rock / paper / scissors / r / p / s ]', bot);
          } else {
            if (rows.result >= 0) {
              say(channel.substring(1), `zHekBot got ${rows.me}. ${tags["display-name"] || tags["username"]} ${rows.result?"won":"tied"}!`, bot);
            } else {
              if (bot.isMod(channel, 'zhekler') && !bot.isMod(channel, tags["username"] ||'')) {
                bot.timeout(channel.substring(1), tags["display-name"] || tags["username"] || '', userIds[channel.substring(1)].timeout, `zHekBot got ${rows.me}. You lost!`)
                .catch(err => {
                  console.log(err.message);
                });
                say(channel.substring(1), `${tags["display-name"] || tags["username"]} lost Rock Paper Scissors!`, bot);
              } else {
                say(channel, `zHekBot got ${rows.me}. ${tags["display-name"] || tags["username"]} lost!`, bot);
              }
            }
          }
          rrcd[tags["username"] || ''] = Date.now() + 15000;
        }
        break;

      // Get user's score in Rock Paper Scissors.
      case '!rpsscore': 
      case '!rpsstats':
      if (!userIds[channel.substring(1)].rps) break;
        say(channel, await rps.rpsScore(tags["display-name"]?tags["display-name"]:tags["username"], channel), bot);
        break;

      // Get the users with the most wins, most losses, and most ties in Rock Paper Scissors.
      case '!rpslb':
        if (!userIds[channel.substring(1)].rps) break;
        say(channel, await rps.rpsLb(channel), bot);
        break;


      /*####################################################################################################################
        Commands for Big Vanish.
      ####################################################################################################################*/

      // Enable Big Vanish. 
      case '!bigvanishon':
        if (userIds[channel.substring(1)].bigvanish || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET bigvanish = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].bigvanish = true;
        say(channel, `Bigvanish enabled.`, bot);
        break;

      // Disable Big Vanish.
      case '!bigvanishoff':
        if (!userIds[channel.substring(1)].bigvanish || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET bigvanish = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].bigvanish = false;
        say(channel, `Bigvanish disabled.`, bot);
        break;

      // Play Big Vanish.
      case '!bigvanish':
        if (!userIds[channel.substring(1)].bigvanish) break;
        if (!bot.isMod(channel.substring(1), 'zhekler')) {
          say(channel, "Big Vanish is unavailable since the bot is not modded.", bot);
          userIds[channel.substring(1)].bigvanish = false;
          helper.dbQuery(`UPDATE allusers SET bigvanish = false::bool WHERE user_id = '${channel.substring(1)}';`);
        }
        if (!bvcd[tags["username"] || ''] || bvcd[tags["username"] || ''] < Date.now()) {
          rows = await bigvanish.bigVanish(tags["display-name"]?tags["display-name"]:tags["username"], channel);
          bot.timeout(channel, `${rows.person.user_id}`, rows.time, `You were timed out for ${numberWithCommas(rows.time)}! Your record high is ${numberWithCommas(rows.person.vanish)} seconds and low is ${numberWithCommas(rows.person.lowest)} seconds.`)
          .catch(err => {
            console.log(err.message);
          });
          say(channel.substring(1), `Big Vanish: ${rows.person.user_id} | ${numberWithCommas(rows.time)} seconds`, bot);
          rrcd[tags["username"] || ''] = Date.now() + 15000;
          setTimeout(function() { 
            bot.unban(channel.substring(1), splits[1])
            .catch(err => {
              console.log(`Untimeout: ${splits[1]}`);
            }) 
          }, 3000);
        }
        break;

      // Get the 3 users with the highest timeouts in Big Vanish.
      case '!bigvanishlb':
        if (!userIds[channel.substring(1)].bigvanish) break;
        say(channel, await bigvanish.bigVanishLb(channel), bot);
        break;

      // Get the 3 users with the lowest timeouts in Big Vanish.
      case '!bigvanishlow':
        if (!userIds[channel.substring(1)].bigvanish) break;
        say(channel, await bigvanish.bigVanishLow(channel), bot);
        break;


      /*####################################################################################################################
        Commands for Custom Tourneys.
      ####################################################################################################################*/
      
      // Enable customs scoring.
      case '!customon':
        if (userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        if (channel.substring(1) === 'huskerrs') {
          say(channel, '!enable !score false', bot);
          say(channel, '!enable !mc false', bot);
        } else {
          say(channel, 'Custom tourney scoring enabled.', bot);
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
          say(channel, '!enable !score true', bot);
          say(channel, '!enable !mc true', bot);
        } else {
          say(channel, 'Custom tourney scoring disabled.', bot);
        }
        helper.dbQuery(`UPDATE allusers SET customs = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].customs = false;
        break;

      // Set the number of maps.
      case '!setmaps': 
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1)) || splits.length == 1) break;
        if (!parseInt(splits[1])) {
          say(channel, 'Map count must be an integer.', bot);
          break;
        }
        helper.dbQuery(`UPDATE customs SET map_count = ${parseInt(splits[1])} WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Map count has been set to ${splits[1]}`, bot);
        break;

      // Set the placement string.
      case '!setplacement':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1)) || splits.length % 2 != 1) break;
        var temp = false;
        for (var i = 1; i < splits.length; i++) {
          if (!parseInt(splits[i])) {
            temp = true;
            say(channel, `'Input must be integer pairs. An example for 1st: 2x, 2nd-8th: 1.5x, 9th+: 1x would be '!setplacement 1 2 2 1.5 9 1'`, bot);
            break;
          }
        }
        if (temp) break;
        helper.dbQuery(`UPDATE customs SET multipliers = '${message.substring(message.indexOf(' ') + 1)}' WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Placement multipliers have been updated.`, bot);
        break;

      // Add a map to the scores.
      case '!addmap':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1)) || splits.length != 3) break;
        if (!parseInt(splits[1]) || !parseInt(splits[2])) {
          say(channel, 'Placement and kills must be integers.', bot);
          break;
        }
        res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
        placement = parseInt(message.split(' ')[1]);
        kills = parseInt(message.split(' ')[2]);
        score = 0;
        
        multis = res[0].multipliers.split(' ');
        for (var i = multis.length/2; i >= 0; i--) {
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
        
        say(channel, `Team ${userIds[channel.substring(1)].pref_name} got ${placement} place with ${kills} kills for ${score.toFixed(2)} points!`, bot);
        break;

      // Remove the last map from the scores.
      case '!removemap':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
        
        res[0].maps.placement.length = res[0].maps.placement.length?res[0].maps.placement.length-1:0;
        
        res[0].maps.kills.length = res[0].maps.kills.length?res[0].maps.kills.length-1:0;
        
        helper.dbQuery(`UPDATE customs SET maps = '{"placement":${res[0].maps.placement.length?'['+res[0].maps.placement.join(',')+']':'[]'},"kills":${res[0].maps.kills.length ?'['+res[0].maps.kills.join(',')+']':'[]'}}'::json WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Last map has been removed.`, bot);
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
        say(channel, str, bot);
        break;

      // Get the score for the maps thus far.
      case '!score':
        if (!userIds[channel.substring(1)].customs && !userIds[channel.substring(1)].two_v_two) break;
        if (userIds[channel.substring(1)].customs) {
          res = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${channel.substring(1)}';`);
          score = [];
          var total = 0;
          
          multis = res[0].multipliers.split(' '), placement = 0;
          
          for (var i = 0; i < res[0].maps.placement.length; i++) {
            for (var j = multis.length/2; j >= 0; j--) {
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
          say(channel, str, bot);
        } else if (userIds[channel.substring(1)]["two_v_two"]) {
          await tvtscores(channel.substring(1), [])
          .catch(err => {
            helper.dumpError(err, `Twitch tvtscores: ${message}`);
          });
        }
        break;

      // Clear all of the maps.
      case '!resetmaps':
        if (!userIds[channel.substring(1)].customs || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE customs SET maps = '{"placement":[],"kills":[]}'::json WHERE user_id = '${channel.substring(1)}';`);
        say(channel, `Maps have been reset.`, bot);
        break;


      /*####################################################################################################################
        Commands for Warzone stats and match tracking.
      ####################################################################################################################*/

      // Enable match tracking.
      case '!matcheson':
        if (userIds[channel.substring(1)].matches || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        if (!userIds[channel.substring(1)].acti_id) {
          say(channel, `You must first set your Activision ID in the dashboard.`, bot);
          break;
        }
        helper.dbQuery(`UPDATE allusers SET matches = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].matches = true;
        say(channel, `Matches enabled.`, bot);
        break;

      // Disable match tracking.
      case '!matchesoff':
        if (!userIds[channel.substring(1)].matches || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET matches = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].matches = false;
        say(channel, `Matches disabled.`, bot);
        break;

      // Get the last game stats.
      case '!lastgame':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await lastGame(channel.substring(1)), bot);
        break;

      // Get the weekly stats.
      case '!lastgames':
      case '!weekly':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await lastGames(channel.substring(1)), bot);
        break;

      // Get the daily stats.
      case '!daily':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await daily(channel.substring(1)), bot);
        break;

      // Get the daily bombs.
      case '!bombs':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await bombs(channel.substring(1)), bot);
        break;

      // Get the daily wins.
      case '!wins': 
      if (!userIds[channel.substring(1)].matches) break;
        say(channel, await wins(channel.substring(1)), bot);
        break;

      // Get the daily gulag record.
      case '!gulag':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await gulag(channel.substring(1)), bot);
        break;

      // Get lifetime stats.
      case '!stats':
      case '!kd':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await stats(userIds[channel.substring(1)].acti_id, userIds[channel.substring(1)].platform), bot);
        break;

      // Get number of semtex kills.
      case '!kobe':
      case '!semtex':
        if (channel.substring(1) !== 'huskerrs') break;
        say(channel, await semtex(), bot);
        break;

      // Get the 5 most frequent teammates this week.
      case '!teammates':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await teammates(userIds[channel.substring(1)].acti_id), bot);
        break;

      // Get the 5 most frequent game modes this week.
      case '!modes':
      case '!gamemodes':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await gamemodes(userIds[channel.substring(1)].acti_id), bot);
        break;
      
      // Get win streak.
      case '!streak':
      case '!winstreak':
        if (!userIds[channel.substring(1)].matches) break;
        say(channel, await streak(channel.substring(1)), bot);
        break;

        
      /*####################################################################################################################
        Commands for 2v2 scorekeeping. Preferably used through the website but here in case.
      ####################################################################################################################*/

      // Enable Two vs Two scoring.
      case '!2v2on':
        if (userIds[channel.substring(1)]["two_v_two"] || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        if (channel.substring(1) === 'huskerrs') {
          say(channel, '!enable !score false', bot);
        } else {
          say(channel, 'Score recording enabled.', bot);
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
          say(channel, '!enable !score true', bot);
        } else {
          say(channel, 'Score recording disabled.', bot);
        }
        helper.dbQuery(`UPDATE allusers SET two_v_two = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)]["two_v_two"] = false;
        delete tvtUpdate[channel.substring(1)];
        break;      

      // Check the stats of a user.
      case '!check':
        if (!tags['mod'] && !vips.includes(tags['username'] || '') && channel.substring(1) !== tags["username"]) break;
        say(channel, await stats(message.substring(message.indexOf(' ') + 1), 'uno'), bot);
        break;

      // Check the stats of a user, Battlenet.
      case '!checkbattle': 
        if (!tags['mod'] && !vips.includes(tags['username'] || '') && channel.substring(1) !== tags["username"]) break;
        say(channel, await stats(message.substring(message.indexOf(' ') + 1), 'battle'), bot);
        break;


      /*####################################################################################################################
        Thank for subscribers or not.
      ####################################################################################################################*/

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


      /*####################################################################################################################
        Moderating commands for VIPs and trusted. Currently only in HusKerrs' chat.
      ####################################################################################################################*/

      // Timeout command for VIPs mainly.
      case '!timeout':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        if (splits.length < 3 || Number.isNaN(parseInt(splits[2]))) break;
        if (!bot.isMod(channel.substring(1), splits[1])) {
          bot.timeout(channel, splits[1], parseInt(splits[2]), `${tags['username']} ${splits[3]?splits.slice(2).join(' '):""}`)
          .catch(err => {
            console.log(err.message);
          });
        }
        break;

      // Untimeout command for VIPs mainly.
      case '!untimeout':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        bot.unban(channel, splits[1])
        .catch(err => {
          console.log(`Untimeout: ${splits[1]}`);
        })
        break;

      // Ban command for VIPs mainly.
      case '!ban':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        if (!bot.isMod(channel.substring(1), splits[1])) {
          bot.ban(channel, splits[1], `${tags['username']} ${splits[2]?' | ' + splits.slice(2).join(' '):""}`)
          .catch(err => {
            console.log(err.message);
          });
        }
        break;

      // Unban command for VIPs mainly.
      case '!unban':
        if (channel.substring(1) !== 'huskerrs' || (!tags["mod"] && !vips.includes(tags['username'] || ''))) break;
        bot.unban(channel, splits[1])
        .catch(err => {
          console.log(`Unban: ${splits[1]}`);
        })
        break;


      /*####################################################################################################################
        Commands for Duels.
      ####################################################################################################################*/
      
      // Enable dueling.
      case '!duelon':
        if (userIds[channel.substring(1)].duel || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET duel = true WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].duel = true;
        say(channel, 'Duels are now enabled.', bot);
        break;

      // Disable dueling.
      case '!dueloff':
        if (!userIds[channel.substring(1)].duel || (!tags["mod"] && tags['username'] !== channel.substring(1))) break;
        helper.dbQuery(`UPDATE allusers SET duel = false WHERE user_id = '${channel.substring(1)}';`);
        userIds[channel.substring(1)].duel = false;
        say(channel, 'Duels are now disabled.', bot);
        break;
      
      // Challenge another user to a duel.
      case '!duel': 
        if (!userIds[channel.substring(1)].duel || splits.length == 1) break;
        if (dcd[tags["username"] || ''] && dcd[tags["username"] || ''] > Date.now()) break;
        if (tags["username"]?.toLowerCase() === splits[1].toLowerCase()) {
          say(channel.substring(1), `@${tags["username"]} : You cannot duel yourself.`, bot);
          break;
        }
        if (splits[1].charAt(0) === '@') splits[1] = splits[1].substring(1);
        str = await duel.duel(tags["username"], splits[1], channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Cancel a duel challenge.
      case '!cancel': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.cancel(tags["username"], channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Reject another user's challenge.
      case '!coward': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.coward(tags["username"], channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Accept another user's challenge.
      case '!accept': 
        if (!userIds[channel.substring(1)].duel) break;
        rows = await duel.accept(tags["username"], channel.substring(1));
        if (rows) {
          say(channel.substring(1), `${rows.winner} has won the duel against ${rows.loser} and is now on a ${rows.streak} win streak!`, bot);
          if (!bot.isMod(channel.substring(1), rows.loser)) {
            bot.timeout(channel.substring(1), rows.loser, userIds[channel.substring(1)].timeout, `You lost the duel to ${rows.winner}. Hold this L`)
            .catch(err => {
              console.log(err.message);
            });
          }
        }
        break;

      // Get user's duel score.
      case '!duelscore':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelScore(tags["username"], channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Get another user's duel score.
      case '!duelscoreother':
        if (!userIds[channel.substring(1)].duel || !splits[1]) break;
        str = await duel.duelScore(splits[1], channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Get the 3 users with the most dueling wins.
      case '!duellb':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLb(channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Get the 3 users with the best win / loss ratio in duels.
      case '!duellbratio':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLbRatio(channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Get the 3 users with the worst win / loss ratio in duels.
      case '!duellbratiolow':
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLbRatioLow(channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;

      // Get the user with the current longest streak and overall longest streak.
      case '!duellbstreak': 
        if (!userIds[channel.substring(1)].duel) break;
        str = await duel.duelLbStreak(channel.substring(1));
        if (str) say(channel.substring(1), str, bot);
        break;


      /*####################################################################################################################
        Couple commands which aren't publicly available.
      ####################################################################################################################*/

      // Set all of the tourney commands after match is done.
      case '!tourneyend':
        if (channel.substring(1) !== 'huskerrs') break; 
        if (!tags["mod"] && tags["username"] !== channel.substring(1)) break;
        say(channel.substring(1), `!editcom !time It’s currently $(time America/Phoenix "h:mm A") for HusKerrs.`, bot);
        for (var i = 0; i < tourneyComs.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          say(channel.substring(1), `!edit ${tourneyComs[i]} Tourney's over! See !results for more`, bot);
        }
        break;


      // Refresh the userIds cache.
      case '!refresh':
        if (tags["username"] !== 'zhekler') break;
        var users = await helper.dbQueryPromise(`SELECT * FROM allusers;`);
        for (var i = 0; i < users.length; i++) {
          userIds[users[i].user_id] = users[i];
        }
        break;


      /*####################################################################################################################
        Goodbye channel peepoBye
      ####################################################################################################################*/
      
      // Exit the channel.
      case '!zhekleave':
        if (tags["username"] !== channel.substring(1) && tags["username"] !== "zhekler") break;
        userIds[channel.substring(1)].twitch = false;
        helper.dbQuery(`UPDATE allusers SET twitch = false WHERE user_id = '${channel.substring(1)}';`);
        say(channel, 'peepoLeave', bot);
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
 * @param {any[]} bearer
 */
async function tvtscores(channel, bearer) {
  try {
    if (!tvtUpdate[channel] || tvtUpdate[channel] < Date.now()) {
      var res = await helper.dbQueryPromise(`SELECT * FROM twovtwo WHERE userid = '${channel}';`);
      var us = res[0].hkills + res[0].tkills;
      var opp = res[0].o1kills + res[0].o2kills;
      var str = `${us} - ${opp}${(us==6 && opp==9)?` Nice`:``} | ${us + res[0].mapreset > opp?("Up "+ (us + res[0].mapreset - opp)):(us + res[0].mapreset < opp)?("Down " + (opp - us - res[0].mapreset)):"Tied"}
      ${res[0].mapreset != 0?(res[0].mapreset > 0?' (Up ':' (Down ') + Math.abs(res[0].mapreset) + ' after reset)':''}`;

      if (bearer.length && scoreBots[bearer[1].userid] && scoreBots[bearer[1].userid].scoreBot.getChannels().includes(`#${channel}`)) {
        scoreBots[bearer[1].userid].scoreBot.say(channel, str);
        scoreBots[bearer[1].userid].timeout = DateTime.now().plus({ minutes: 30 }).toMillis();
      } else {
        say(channel, str, bot);
      }
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
  say(channel, `${username} Thank you for the sub, welcome to the Huskies huskHype huskLove`, bot);
});


// Twitch bot resubscription handler.
bot.on('resub', (channel, username, months, message, userstate, methods) => {
  if (!userIds[channel.substring(1)].subs) return;
  say(channel, `${username} Thank you for the ${userstate['msg-param-cumulative-months']} month resub huskHype huskLove`, bot);
});


var subs = {};


// Twitch sub gift.
bot.on('subgift', (channel, username, months, recipient, userstate, methods) => {
  if (!userIds[channel.substring(1)].subs) return;
  if (subs[username]) {
    subs[username] -= 1;
  } else {
    say(channel, `@${username} Thank you for the ${userstate["msg-param-sender-count"] > 1?''+ userstate["msg-param-sender-count"] + 'gifted subs!':'gifted sub to ' + recipient}! huskHype huskLove`, bot);
  }

  console.log('subgift ' + username);
});


// Twitch anon sub gift.
bot.on('anonsubgift', (channel, months, recipient, userstate, methods) => {
  if (!userIds[channel.substring(1)].subs) return;
  if (subs["anon"]) {
    subs["anon"] -= 1;
  } else {
    say(channel, `Anonymous, thank you for the ${userstate["msg-param-sender-count"] > 1?''+ userstate["msg-param-sender-count"] + 'gifted subs':'gifted sub to ' + recipient}! huskHype huskLove`, bot);
  }

  console.log('anonsubgift');
});


// Twitch sub mystery gift.
bot.on('submysterygift', (channel, username, numbOfSubs, userstate, methods) => {
  if (!userIds[channel.substring(1)].subs) return;
  subs[username] = numbOfSubs;

  console.log('submysterygift ' + username + ' ' + numbOfSubs);
  say(channel, `${username} Thank you for the ${numbOfSubs > 1?''+ numbOfSubs + ' gifted subs':'gifted sub'}! huskHype huskLove`, bot);
});


// Twitch sub mystery gift.
bot.on('anonsubmysterygift', (channel, numbOfSubs, userstate, methods) => {
  if (!userIds[channel.substring(1)].subs) return;
  subs["anon"] = numbOfSubs;

  console.log('submysterygift ' + numbOfSubs);
  say(channel, `Anonymous, thank you for the ${numbOfSubs > 1?''+ numbOfSubs + ' gifted subs':'gifted sub'}! huskHype huskLove`, bot);
});


// Prime paid upgrade.
bot.on('primepaidupgrade', (channel, username, methods, tags) => {
  if (!userIds[channel.substring(1)].subs) return;
  say(channel, `${username} Thank you for upgrading from a Twitch Prime subscription! huskHype huskLove`, bot);
});


// Gifted paid upgrade.
bot.on('giftpaidupgrade', (channel, username, sender, userstate) => {
  if (!userIds[channel.substring(1)].subs) return;
  say(channel, `${username} Thank you for continuing your gifted sub from ${sender}! huskHype huskLove`, bot);
});


// Anon gift paid upgrade.
bot.on('anongiftpaidupgrade', (channel, username, userstate) => {
  if (!userIds[channel.substring(1)].subs) return;
  say(channel, `${username} Thank you for continuing your gifted sub from Anonymous! huskHype huskLove`, bot);
});


// Make the COD API game_mode more readable.
var game_modes = {
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
var baseCookie = "new_SiteId=cod; ACT_SSO_LOCALE=en_US;country=US;";
var loggedIn = false;


// Axios for queries to the COD API.
var apiAxios = axios.create({
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
var loginAxios = apiAxios;
var defaultBaseURL = "https://my.callofduty.com/api/papi-client/";
console.log("Created apiAxios.");


// Axios for queries to Twitch.
var symAxios = axios.create({
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
      var response = error.response;
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
      var loginURL = "https://profile.callofduty.com/cod/mapp/";
      var randomId = uniqid();
      var md5sum = crypto.createHash('md5');
      var deviceId = md5sum.update(randomId).digest('hex');
      postReq(`${loginURL}registerDevice`, {
          'deviceId': deviceId
      }).then((response) => {
          console.log(response);
          var fakeXSRF = "68e8b62e-1d9d-4ce1-b93f-cbe5ff31a041";
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
      var urlInput = defaultBaseURL + `crm/cod/v2/title/mw/platform/${platform}/gamer/${gamertag}/matches/wz/start/0/end/0/details`;
      sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  });
};

// 20 matches from date.
function date20(gamertag, platform, date) {
  return new Promise((resolve, reject) => {
    var urlInput = defaultBaseURL + `crm/cod/v2/title/mw/platform/${platform}/gamer/${gamertag}/matches/wz/start/0/end/${date*1000}/details`;
    sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  })
}

// Pull match info from match ID.
function matchInfo(matchID) {
  return new Promise((resolve, reject) => {
      var urlInput = defaultBaseURL + `crm/cod/v2/title/mw/platform/acti/fullMatch/wz/${matchID}/en`;
      sendRequest(urlInput).then(data => resolve(data)).catch(e => reject(e));
  });
};


// Pull lifetime stats from COD API.
function lifetime(gamertag, platform) {
  return new Promise((resolve, reject) => {
    var urlInput = defaultBaseURL + `stats/cod/v1/title/mw/platform/${platform}/gamer/${gamertag}/profile/type/wz`;
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
app.use(express.raw({ type: 'application/json' }));


// Home page.
app.get('/', async (request, response) => {
  try {
    
    // Use site cookies to check whether user is logged in already.
    var cookies = await request.cookies;
    var page;
    if (cookies["auth"]) {

      var rows = await helper.checkBearer(cookies["auth"]);
      if (!rows[0]) throw new Error("No bearer in DB - 401.");

      // Verify the token is valid.
      await axios.get('https://id.twitch.tv/oauth2/validate', {
        headers: {
          "Authorization": `Bearer ${cookies["auth"]}`
        }
      }).then(async res => {

        if (res.status === 200) {

          // Set up the page for a logged in user.
          page = fs.readFileSync('./html/page.html').toString('utf-8');
          page = page.replace(/#modules#/g, `href="/modules/${rows[1].userid}"`);
          page = page.replace(/#twovtwo#/g, `href="/twovtwo/${rows[1].userid}"`);
          page = page.replace(/#customs#/g, `href="/customs/${rows[1].userid}"`);
          page = page.replace(/#editors#/g, `href="/editors/${rows[1].userid}"`);
          page = page.replace(/#permissions#/g, `href="/permissions/${rows[1].userid}"`);
          page = page.replace(/#pref_name#/g, userIds[rows[1].userid].pref_name);
          page = page.replace(/#channel#/g, rows[1].userid);
          page = page.replace(/#checked#/g, userIds[rows[1].userid].twitch?'checked':'');
          page = page.replace('Login to Twitch', 'Logout of Twitch');
          if (userIds[rows[1].userid].twitch) page = page.replace('var enabled = false', 'var enabled = true');

          response.send(page); 
        } else {

          // Unexpected status; clear cookie and refresh;
          helper.removeBearer(cookies["auth"]);
          response.clearCookie('auth', {
            'domain': '.zhekbot.com',
            secure: true,
            httpOnly: true
          });
          response.redirect('/');
        }
      }).catch(err => {

        // Unauthorized status; clear cookie and refresh.
        if (err.toString().includes('401')) {
          helper.removeBearer(cookies["auth"]);
          response.clearCookie('auth', {
            'domain': '.zhekbot.com',
            secure: true,
            httpOnly: true
          });
          response.redirect('/');
        } else {

          // Handle error.
          helper.dumpError(err, `Home page validation.`);
          response.send(err);
        }
        return;
      });

    } else {

      // User is not logged in; send page with no user-specific information.
      page = fs.readFileSync('./html/not_enabled.html').toString('utf-8');
      page = page.replace(/#CLIENT_ID#/g, process.env.CLIENT_ID + '');
    
      response.send(page); 
    }
  } catch (err) {

    // Some sort of error; clear cookie and refresh.
    response.clearCookie('auth', {
      'domain': '.zhekbot.com',
      secure: true,
      httpOnly: true
    });
    response.status(500);
    response.redirect('/');
  }
});


// Enable/disable.
app.get('/enable/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check if user has permission to use this path.
    if (!userIds[request.params.channel]) {
      response.sendStatus(404);
      return;
    }
    
    var cookies = request.cookies;
    if (cookies["auth"]) {
      let bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.sendStatus(401);
        response.redirect('/');
        return;
      }
    } else {
      response.sendStatus(401);
      response.redirect('/');
      return;
    }

    // Change zHekBot status in local cache and DB.
    userIds[request.params.channel].twitch = !userIds[request.params.channel].twitch;
    helper.dbQuery(`UPDATE allusers SET twitch = ${userIds[request.params.channel].twitch} WHERE user_id = '${request.params.channel}';`);

    // Join/leave Twitch channel.
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
    
    // Check if user has permission to use this path.
    request.params.channel = request.params.channel.toLowerCase();
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/');
      return;
    }
    
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if (!rows[0] || !rows[1].perms || !rows[1].perms.split(',').includes(request.params.channel)) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.sendStatus(401);
      response.redirect('/');
      return;
    }

    // Validate bearer token with Twitch API.
    await axios.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        "Authorization": `Bearer ${cookies['auth']}`
      }
    }).then(async res => {
      if (res.status === 200) {

        // Cookie checks out. Set up the page. 
        if (rows[1].perms.split(',').includes(request.params.channel.toLowerCase())) {
          var page = fs.readFileSync('./html/page.html').toString('utf-8');
          page = page.replace(/#pref_name#/g, userIds[request.params.channel.toLowerCase()].pref_name);
          page = page.replace(/#channel#/g, userIds[request.params.channel.toLowerCase()].user_id);
          page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
          page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
          page = page.replace(/#checked#/g, userIds[request.params.channel.toLowerCase()].twitch?'checked':'');
          page = page.replace(/Login to Twitch/g, 'Logout of Twitch');
          if (userIds[request.params.channel].twitch) page = page.replace('var enabled = false', 'var enabled = true');

          response.send(page);
        } else {
          response.status(401);
          response.redirect('/');
        }
      } else {
        response.status(401);
        response.redirect('/');
      }
    }).catch(err => {
      console.log(err);
      response.status(400);
      response.redirect('/');
    })
  } catch (err) {
    if (!err.message.includes('400')) {
      helper.dumpError(err, `Editors home page.`);
    }
    response.status(400);
    response.redirect('/');
  }
});


// Commands page.
app.get('/commands/:channel', async (request, response) => {
  var page = '';
  try {

    // Check whether this channel is in the local cache.
    if (Object.keys(userIds).includes(request.params.channel.toLowerCase())) {

      // They is. Set up page.
      page = fs.readFileSync("./html/commands.html").toString('utf-8');
      page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);

      page = page.replace("var tabsEnabled = {}", `var tabsEnabled = {
        'Warzone Stats / Matches': ${userIds[request.params.channel.toLowerCase()].matches},
        'Revolver Roulette': ${userIds[request.params.channel.toLowerCase()].revolverroulette},
        'Coinflip': ${userIds[request.params.channel.toLowerCase()].coinflip},
        'Rock Paper Scissors': ${userIds[request.params.channel.toLowerCase()].rps},
        'Big Vanish': ${userIds[request.params.channel.toLowerCase()].bigvanish},
        'Custom Tourney': ${userIds[request.params.channel.toLowerCase()].customs},
        'Two vs Two': ${userIds[request.params.channel.toLowerCase()]["two_v_two"]},
        'Duel': ${userIds[request.params.channel.toLowerCase()].duel}
      }`);

      // Check what permissions this user has and continue setting up the page.
      var cookies = await request.cookies;
      if (cookies["auth"]) {
        var bearer = await helper.checkBearer(cookies["auth"]);

        page = page.replace('Login to Twitch', 'Logout of Twitch');
        page = page.replace(/#modules#/g, `href="/modules/${request.params.channel.toLowerCase()}"`);
        page = page.replace(/#twovtwo#/g, `href="/twovtwo/${request.params.channel.toLowerCase()}"`);
        page = page.replace(/#customs#/g, `href="/customs/${request.params.channel.toLowerCase()}"`);
        page = page.replace(/#channel#/g, userIds[request.params.channel.toLowerCase()].user_id);

        if (bearer[0] && bearer[1].userid === request.params.channel) {
          page = page.replace(/#editors#/g, `href="/editors/${request.params.channel}"`);
          page = page.replace(/#permissions#/g, `href="/permissions/${request.params.channel}"`);
        } else {
          page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
          page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
        }
      } else {
        page = page.replace(/#modules#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#twovtwo#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#customs#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#channel#/g, 'zhekler');
        page = page.replace(/#CLIENT_ID#/g, process.env.CLIENT_ID + '');
      }
  
      response.send(page);
    } else {
      response.status(404);
      response.redirect('/not-found');
      return;
    }

  } catch (err) {
    helper.dumpError(err, "Commands page.");
    response.sendStatus(500);
  } 
});


// Leaderboards page.
app.get('/leaderboards/:channel', async (request, response) => {
  var page = '';
  try {
    
    // Check whether this channel is in the local cache.
    if (Object.keys(userIds).includes(request.params.channel.toLowerCase())) {
      page = fs.readFileSync("./html/leaderboards.html").toString('utf-8');
      page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);

      // Check what permissions this user. Set up page.
      var cookies = await request.cookies;
      if (cookies["auth"]) {
        var bearer = await helper.checkBearer(cookies["auth"]);

        page = page.replace('Login to Twitch', 'Logout of Twitch');
        page = page.replace(/#modules#/g, `href="/modules/${request.params.channel.toLowerCase()}"`);
        page = page.replace(/#twovtwo#/g, `href="/twovtwo/${request.params.channel.toLowerCase()}"`);
        page = page.replace(/#customs#/g, `href="/customs/${request.params.channel.toLowerCase()}"`);
        page = page.replace(/#channel#/g, userIds[request.params.channel.toLowerCase()].user_id);

        if (bearer[0] && bearer[1].userid === request.params.channel) {
          page = page.replace(/#editors#/g, `href="/editors/${request.params.channel}"`);
          page = page.replace(/#permissions#/g, `href="/permissions/${request.params.channel}"`);
        } else {
          page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
          page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
        }
      } else {
        page = page.replace(/#modules#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#twovtwo#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#customs#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
        page = page.replace(/#channel#/g, 'zhekler');
        page = page.replace(/#CLIENT_ID#/g, process.env.CLIENT_ID + '');
      }
  
      response.send(page);
    } else {
      response.status(404);
      response.redirect('/not-found');
      return;
    }

  } catch (err) {
    helper.dumpError(err, "Commands page.");
    response.sendStatus(500);
  } 
});


// Duel leaderboard.
app.get('/leaderboards/:channel/duels', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Initialize JSON object.
    var stats = {
      "wins": {},
      "losses": {},
      "streak": {},
      "best_ratio": {},
      "worst_ratio": {}
    };

    // Fill the JSON object.
    stats["wins"]["stream"] = await helper.dbQueryPromise(`SELECT userid, wins FROM duelduel WHERE stream = '${request.params.channel}' ORDER BY wins DESC LIMIT 10;`);
    stats["wins"]["all-time"] = await helper.dbQueryPromise(`SELECT userid, SUM(wins) as wins FROM duelduel GROUP BY userid ORDER BY wins DESC LIMIT 10;`);
  
    stats["losses"]["stream"] = await helper.dbQueryPromise(`SELECT userid, losses FROM duelduel WHERE stream = '${request.params.channel}' ORDER BY losses DESC LIMIT 10;`);
    stats["losses"]["all-time"] = await helper.dbQueryPromise(`SELECT userid, SUM(losses) as losses FROM duelduel GROUP BY userid ORDER BY losses DESC LIMIT 10;`);

    stats["streak"]["stream"] = await helper.dbQueryPromise(`SELECT userid, longest FROM duelduel WHERE stream = '${request.params.channel}' ORDER BY longest DESC LIMIT 10;`);
    stats["streak"]["all-time"] = await helper.dbQueryPromise(`SELECT userid, longest FROM duelduel ORDER BY longest DESC LIMIT 10;`);

    stats["best_ratio"]["stream"] = await helper.dbQueryPromise(`SELECT userid, wins, losses, ROUND(wins * 100.0 / (wins + losses), 2) AS percent FROM (SELECT * FROM duelduel WHERE wins + losses >= 10 AND stream = '${request.params.channel}') AS duels ORDER BY percent DESC LIMIT 10;`);
    stats["best_ratio"]["all-time"] = await helper.dbQueryPromise(`SELECT userid, tot_wins as wins, tot_losses as losses, ROUND(tot_wins * 100.0 / (tot_wins + tot_losses), 2) as percent FROM (SELECT userid, SUM(wins) as tot_wins, SUM(losses) as tot_losses FROM duelduel GROUP BY userid) AS duels WHERE tot_wins + tot_losses >= 10 ORDER BY percent DESC LIMIT 10;`);
    
    stats["worst_ratio"]["stream"] = await helper.dbQueryPromise(`SELECT userid, wins, losses, ROUND(wins * 100.0 / (wins + losses), 2) AS percent FROM (SELECT * FROM duelduel WHERE wins + losses >= 10 AND stream = '${request.params.channel}') AS duels ORDER BY percent ASC LIMIT 10;`);
    stats["worst_ratio"]["all-time"] = await helper.dbQueryPromise(`SELECT userid, tot_wins as wins, tot_losses as losses, ROUND(tot_wins * 100.0 / (tot_wins + tot_losses), 2) AS percent FROM (SELECT userid, SUM(wins) as tot_wins, SUM(losses) as tot_losses FROM duelduel GROUP BY userid) as duels WHERE tot_wins + tot_losses >= 10 ORDER BY percent ASC LIMIT 10;`);

    response.status(200);
    response.send(JSON.stringify(stats));
  } catch (err) {
    helper.dumpError(err, "Duel leaderboard for " + request.params.channel);
    response.sendStatus(500);
  }
});


// Revolver Roulette leaderboard.
app.get('/leaderboards/:channel/rr', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Initialize JSON object.
    var stats = {
      "survive": {},
      "die": {},
      "best_ratio": {},
      "worst_ratio": {}
    }

    // Fill the JSON object.
    stats["survive"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, survive FROM revolverroulette WHERE stream = '${request.params.channel}' ORDER BY survive DESC LIMIT 10;`);
    stats["survive"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(survive) as survive FROM revolverroulette GROUP BY user_id ORDER BY survive DESC LIMIT 10;`);

    stats["die"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, die FROM revolverroulette WHERE stream = '${request.params.channel}' ORDER BY die DESC LIMIT 10;`);
    stats["die"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(die) as die FROM revolverroulette GROUP BY user_id ORDER BY die DESC LIMIT 10;`);

    stats["best_ratio"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, survive, die, ROUND(survive * 100.0 / (survive + die), 2) AS percent FROM (SELECT * FROM revolverroulette WHERE survive + die >= 10 AND stream = '${request.params.channel}') AS rr ORDER BY percent DESC LIMIT 10;`);
    stats["best_ratio"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, tot_survive as survive, tot_die as die, ROUND(tot_survive * 100.0 / (tot_survive + tot_die), 2) as percent FROM (SELECT user_id, SUM(survive) as tot_survive, SUM(die) as tot_die FROM revolverroulette GROUP BY user_id) AS rr WHERE tot_survive + tot_die >= 10 ORDER BY percent DESC LIMIT 10;`);

    stats["worst_ratio"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, survive, die, ROUND(survive * 100.0 / (survive + die), 2) AS percent FROM (SELECT * FROM revolverroulette WHERE survive + die >= 10 AND stream = '${request.params.channel}') AS rr ORDER BY percent ASC LIMIT 10;`);
    stats["worst_ratio"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, tot_survive as survive, tot_die as die, ROUND(tot_survive * 100.0 / (tot_survive + tot_die), 2) AS percent FROM (SELECT user_id, SUM(survive) as tot_survive, SUM(die) as tot_die FROM revolverroulette GROUP BY user_id) as rr WHERE tot_survive + tot_die >= 10 ORDER BY percent ASC LIMIT 10;`);

    response.status(200);
    response.send(JSON.stringify(stats));
  } catch (err) {
    helper.dumpError(err, "RR leaderboard for " + request.params.channel);
    response.sendStatus(500);
  }
});


// Rock Paper Scissors leaderboard.
app.get('/leaderboards/:channel/rps', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Initialize JSON object.
    var stats = {
      "win": {},
      "loss": {},
      "tie": {}
    }

    // Fill the JSON object.
    stats["win"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, win FROM rockpaperscissors WHERE stream = '${request.params.channel}' ORDER BY win DESC LIMIT 10;`);
    stats["win"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(win) as win FROM rockpaperscissors GROUP BY user_id ORDER BY win DESC LIMIT 10;`);

    stats["loss"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, loss FROM rockpaperscissors WHERE stream = '${request.params.channel}' ORDER BY loss DESC LIMIT 10;`);
    stats["loss"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(loss) as loss FROM rockpaperscissors GROUP BY user_id ORDER BY loss DESC LIMIT 10;`);

    stats["tie"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, tie FROM rockpaperscissors WHERE stream = '${request.params.channel}' ORDER BY tie DESC LIMIT 10;`);
    stats["tie"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(tie) as tie FROM rockpaperscissors GROUP BY user_id ORDER BY tie DESC LIMIT 10;`);

    response.status(200);
    response.send(JSON.stringify(stats));
  } catch (err) {
    helper.dumpError(err, "RPS leaderboard for " + request.params.channel);
    response.sendStatus(500);
  }
});


// Coinflip leaderboard.
app.get('/leaderboards/:channel/coin', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Initialize JSON object.
    var stats = {
      "correct": {},
      "wrong": {}
    }

    // Fill the JSON object.
    stats["correct"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, correct FROM coinflip WHERE stream = '${request.params.channel}' ORDER BY correct DESC LIMIT 10;`);
    stats["correct"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(correct) as correct FROM coinflip GROUP BY user_id ORDER BY correct DESC LIMIT 10;`);

    stats["wrong"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, wrong FROM coinflip WHERE stream = '${request.params.channel}' ORDER BY wrong DESC LIMIT 10;`);
    stats["wrong"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, SUM(wrong) as wrong FROM coinflip GROUP BY user_id ORDER BY wrong DESC LIMIT 10;`);

    response.status(200);
    response.send(JSON.stringify(stats));
  } catch (err) {
    helper.dumpError(err, "Coinflip leaderboard for " + request.params.channel);
    response.sendStatus(500);
  }
});


// Big Vanish leaderboard.
app.get('/leaderboards/:channel/bigvanish', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Initialize the JSON object.
    var stats = {
      "high": {},
      "low": {}
    }

    // Fill the JSON object.
    stats["high"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, vanish FROM bigvanish WHERE stream = '${request.params.channel}' ORDER BY vanish DESC LIMIT 10;`);
    stats["high"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, vanish FROM bigvanish ORDER BY vanish DESC LIMIT 10;`);

    stats["low"]["stream"] = await helper.dbQueryPromise(`SELECT user_id, lowest FROM bigvanish WHERE stream = '${request.params.channel}' ORDER BY lowest ASC LIMIT 10;`);
    stats["low"]["all-time"] = await helper.dbQueryPromise(`SELECT user_id, lowest FROM bigvanish ORDER BY lowest ASC LIMIT 10;`);

    response.status(200);
    response.send(JSON.stringify(stats));
  } catch (err) {
    helper.dumpError(err, "Big Vanish leaderboard for " + request.params.channel);
    response.sendStatus(500);
  }
});


// Editors.
app.get('/editors/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Only channel owner has access to this page.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      let bearer = await helper.checkBearer(cookies["auth"]);
      if (!bearer[0] || bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Set up page.
    var page = fs.readFileSync('./html/editors.html').toString('utf-8');
    var rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE perms LIKE '%${request.params.channel}%';`);
    var str = '';

    for (var i = 0; i < rows.length; i++) {
      var perms = rows[i].perms.split(',');
      if (perms.includes(request.params.channel)) {
        str += `<tr id="editor-${rows[i].userid}"><td style="border: 1px solid gray; padding: 0.2vh 0.2vw; text-align: center;">${rows[i].userid}</td><td style="border: 1px solid gray; padding: 0.2vh 0.2vw; text-align: center;")"><a class="btn btn--border theme-btn--primary-inverse sqs-button-element--primary" onclick="rem('editor-${rows[i].userid}')">Remove</a></td></tr><tr>&emsp;</tr>`;
      }
    }

    page = page.replace(/#editors#/g, str);
    page = page.replace(/#channel#/g, userIds[request.params.channel].user_id);
    page = page.replace(/Login to Twitch/g, "Logout of Twitch");

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

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel] || !request.get('editor')) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Only channel owner can use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      var bearer = await helper.checkBearer(cookies["auth"]);
      if (!bearer[0] || bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Add editor to DB.
    var rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${request.get('editor')}';`);
    if (!rows.length) {
      helper.dbQuery(`INSERT INTO permissions(userid, perms) VALUES ('${request.get('editor')}', '${request.params.channel}')`);
    } else if (!rows[0].perms) {
      helper.dbQuery(`UPDATE permissions SET perms = '${request.params.channel}' WHERE userid = '${request.get('editor')}';`);
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

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Only the channel owner can use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      var bearer = await helper.checkBearer(cookies["auth"]);
      if (!bearer[0] || bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    if (!request.get('editor')) {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Remove editor from DB.
    var rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${request.get('editor')}';`);
    var perms = rows[0].perms?rows[0].perms.split(','):"";
    perms.splice(rows[0].perms.indexOf(request.params.channel), 1);
    helper.dbQuery(`UPDATE permissions SET perms = '${perms.join(',')}' WHERE userid = '${request.get('editor')}';`);

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Remove editor.`);
    response.sendStatus(500);
  }
});


// Permissions page.
app.get('/permissions/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Only channel owner can use this page.
    var cookies = request.cookies;
    var rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if (!rows[0] || rows[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Set up page.
    var page = fs.readFileSync('./html/permissions.html').toString('utf-8');
    page = page.replace(/Login to Twitch/g, "Logout of Twitch");
    page = page.replace(/#channel#/g, rows[1].userid);
    
    var perms = rows[1].perms?rows[1].perms.split(','):'';
    if (!perms.length) {
      page = page.replace(/#permission#/g, 'You do not have permissions to any channels.');
    } else {
      var str = '<h3 style="width: 100%; text-align: center;">Permissions:</h3>';
      for (var i = 0; i < perms.length; i++) {
        str += `<tr><td style="padding: 2px; text-align: center;"><a href="/edit/${perms[i]}" class="btn btn--border theme-btn--primary-inverse sqs-button-element--primary">${userIds[perms[i]].pref_name}</a></td></tr><tr>&emsp;</tr>`;
      }
      page = page.replace(/#permissions#/g, str);
    }

    response.send(page);
  } catch (err) {
    helper.dumpError(err, "Permissions page main.");
    response.sendStatus(500);
  }
});


// States.
var states = [];


// Modules.
app.get('/modules/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner can use this page.
    var cookies = request.cookies;
    var bearer;
    if (cookies["auth"]) {
      bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Set up page.
    var page = fs.readFileSync('./html/modules.html').toString('utf-8');
    page = page.replace(/#channel#/g, userIds[request.params.channel.toLowerCase()].user_id);
    page = page.replace(/Login to Twitch/g, "Logout of Twitch");
    page = page.replace('var tabsEnabled = {};', `var tabsEnabled = {
      'Warzone Stats / Matches': ${userIds[request.params.channel.toLowerCase()].matches},
      'Revolver Roulette': ${userIds[request.params.channel.toLowerCase()].revolverroulette},
      'Coinflip': ${userIds[request.params.channel.toLowerCase()].coinflip},
      'Rock Paper Scissors': ${userIds[request.params.channel.toLowerCase()].rps},
      'Big Vanish': ${userIds[request.params.channel.toLowerCase()].bigvanish},
      'Custom Tourney': ${userIds[request.params.channel.toLowerCase()].customs},
      'Two vs Two': ${userIds[request.params.channel.toLowerCase()]["two_v_two"]},
      'Duels': ${userIds[request.params.channel.toLowerCase()].duel}
    };`);
    page = page.replace(/#acti#/g, userIds[request.params.channel.toLowerCase()] && userIds[request.params.channel.toLowerCase()].acti_id?`value="${userIds[request.params.channel.toLowerCase()].acti_id}"`:'placeholder="Activision ID"'); 
    page = page.replace(/#pref_name#/g, userIds[request.params.channel.toLowerCase()].pref_name || '');

    // Editors can't access the editors and permissions for this channel.
    if (bearer[1].userid === request.params.channel) {
      page = page.replace(/#editors#/g, `href="/editors/${request.params.channel}"`);
      page = page.replace(/#permissions#/g, `href="/permissions/${request.params.channel}"`);
    } else {
      page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
    }

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

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner can use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      let bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Enable or disable the module.
    var str = '';
    if (request.params.module === 'matches') {

      // Check the Activision ID.
      var acti_id = request.get('Acti') || '';
      if (!userIds[request.params.channel].matches && 
          (!userIds[request.params.channel].acti_id || userIds[request.params.channel].acti_id === '' || userIds[request.params.channel].acti_id !== decodeURIComponent(acti_id))) {
        if (acti_id === '') throw new Error('Blank Acti ID.');
        if (profanity.isProfane(acti_id || '')) throw new Error('No profanity allowed.');
        str += `, acti_id = '${decodeURIComponent(acti_id || '')}'`;
        userIds[request.params.channel].acti_id = decodeURIComponent(acti_id || '');
        var data = await last20(acti_id, 'uno');
        str += `, uno_id = '${data.matches[0].player.uno}'`;
      }

      // Set up Twitch Event Subscription to be notified when this channel goes online.
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

          // Set up Twitch Event Subscription to be notified when this channel goes offline.
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
          
          // Set values in local cache and DB.
          helper.dbQuery(`UPDATE allusers SET event_sub = true::bool WHERE user_id = '${request.params.channel}';`);
          userIds[request.params.channel].event_sub = true;

          // If this user has no matches in the database, query COD API for matches within the last week.
          var mCache = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${request.params.channel}';`);
          if (!mCache || !mCache.length) weekMatches(request.params.channel);

        } else if (userIds[request.params.channel].matches && userIds[request.params.channel].event_sub) {

          // Disable Twitch Event Subscription to be notified when this channel goes live.
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

          // Disable Twitch Event Subscription to be notified when this channel goes offline.
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

          // Set values in local cache and DB.
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


// Update Acti settings.
app.get('/updateacti/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner may use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      let bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Get Activision ID and Warzone type (1 or 2).
    var acti = decodeURIComponent(request.get('Acti') || '');
    var wzType = decodeURIComponent(request.get('wzType') || '');

    if (profanity.isProfane(acti || '')) throw new Error('No profanity allowed.');
  
    var data = await last20(acti, 'uno');
    var uno = data.matches[0].player.uno;

    helper.dbQuery(`UPDATE allusers SET acti_id = '${acti}', uno_id = '${uno}', wz_type = ${wzType==='Warzone 1'?1:2} WHERE user_id = '${request.params.channel}';`);

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, "Update Acti.");
    response.sendStatus(400);
  }
});


// Set new preferred name.
app.get('/newname/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editor and channel owner may use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      let bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Check new preferred name.
    if (profanity.isProfane(request.get('pref_name') + '')) throw new Error('No profanity allowed.');
    userIds[request.params.channel].pref_name = request.get('pref_name');

    helper.dbQuery(`UPDATE allusers SET pref_name = '${request.get('pref_name')}' WHERE user_id = '${request.params.channel}';`);

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Update pref name.`);
    response.sendStatus(500);
  }
});


// Redirect.
app.get('/redirect', async (request, response) => {
  try {
    var page = fs.readFileSync("./html/redirect.html").toString("utf-8");

    // Check for cookie and set up page.
    var cookies = await request.cookies;
    if (cookies["auth"]) {
      var rows = await helper.checkBearer(cookies["auth"]);
      if (!rows[0]) {
        response.sendStatus(500);
        return;
      }

      page = page.replace('Login to Twitch', 'Logout of Twitch');
      page = page.replace(/#modules#/g, `href="/modules/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#twovtwo#/g, `href="/twovtwo/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#customs#/g, `href="/customs/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#editors#/g, `href="/editors/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#permissions#/g, `href="/permissions/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#channel#/g, rows[1].userid.toLowerCase());
    } else {
      page = page.replace(/#modules#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#twovtwo#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#customs#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#channel#/g, 'zhekler');
      page = page.replace(/#CLIENT_ID#/g, process.env.CLIENT_ID + '');
    }

    response.send(page);
  } catch(err) {
    helper.dumpError(err, "Redirect page.");
    response.sendStatus(500);
  }
});


// Log in to Twitch.
app.get('/login', async (request, response) => {
  try {

    // Check whether this user is already logged in.
    var cookies = request.cookies;
    if (!cookies["auth"]) {
      
      // Get state that was passed and put a 30 second timer on it.
      var state = request.get("state") || '';
      if (!state || state.length != 20) {
        console.log("Invalid state: " + state);
        response.sendStatus(500)
        return;
      }
      
      states[state] = '#login#';
      response.sendStatus(200);

      setTimeout(function() {
        if (states.indexOf(state) > -1) delete states[state];
      }, 30000);
    } else {

      // Log out and remove cookie.
      helper.removeBearer(cookies["auth"]);
      response.clearCookie('auth', {
        'domain': '.zhekbot.com',
        secure: true,
        httpOnly: true
      });
      response.sendStatus(201);
    }
  } catch (err) {
    helper.dumpError(err, `Login.`);
    response.send(err);
  }
});


// Logout.
app.get('/logout', async (request, response) => {
  try {

    // Check cookie and log out.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      helper.removeBearer(cookies["auth"]);
      response.clearCookie('auth', {
        'domain': '.zhekbot.com',
        secure: true,
        httpOnly: true
      });
      response.sendStatus(201);
      return;
    }
    response.sendStatus(400);
  } catch (err) {
    helper.dumpError(err, "Logout");
    response.sendStatus(500);
  }
});


// Verify state.
app.get('/verify', (request, response) => {
  try {

    // Check response from Twitch.
    if (request.get("state") === "access_denied") {
      console.log("Access denied in login.");
      response.send("Access was denied.");
      return;
    }
    
    // Check whether the state is still fresh.
    if (Object.keys(states).includes(request.get("state") || '')) {
      axios.post('https://id.twitch.tv/oauth2/token', 
        `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`, 
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
      }).then(resp => {

        // Get username.
        axios.get('https://api.twitch.tv/helix/users?', {
          headers: {
            'Authorization': `Bearer ${request.get("access_token")}`,
            'Client-Id': process.env.CLIENT_ID || ''
          }
        }).then(async res => {

          // Make sure user is in DB.
          var details = res.data.data;
          var rows = await helper.dbQueryPromise(`SELECT * FROM permissions WHERE userid = '${details[0]["display_name"].toLowerCase()}';`);
          
          // @ts-ignore
          if (rows.length && (rows[0].perms > 0 && rows[0].perms.split(',').includes(states[request.get("state")]) || details[0]["display_name"].toLowerCase() === states[request.get("state")] || states[request.get("state")] === "#login#")) {
            helper.addBearer(details[0]["display_name"].toLowerCase(), resp.data["access_token"]);
            response.cookie("auth", resp.data["access_token"], { maxAge: 1000*resp.data.expires_in, secure: true, httpOnly: true, domain: `.zhekbot.com` });
            response.send("Success.");
          } else {
            
            // @ts-ignore
            if (details[0]["display_name"].toLowerCase() === states[request.get("state")] || states[request.get("state")] === '#login#') {
              helper.addBearer(details[0]["display_name"].toLowerCase(), resp.data["access_token"]);
              response.cookie("auth", resp.data["access_token"], { maxAge: 1000*resp.data.expires_in, secure: true, httpOnly: true, domain: `.zhekbot.com` });
              response.send("Success.");
            } else { 
              response.send("Login request failed."); 
              return;
            }
          }

          // Set up standard pieces.
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


// 2v2
app.get('/twovtwo/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner may use this page.
    var cookies = request.cookies;
    var bearer;
    if (cookies["auth"]) {
      bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Set up page.
    var page = fs.readFileSync('./html/two_v_two.html').toString('utf-8');
    page = page.replace(/Login to Twitch/g, "Logout of Twitch");
    page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);
    page = page.replace(/#channel#/g, userIds[request.params.channel].user_id);

    if (bearer[1].userid === request.params.channel) {
      page = page.replace(/#editors#/g, `href="/editors/${request.params.channel}"`);
      page = page.replace(/#permissions#/g, `href="/permissions/${request.params.channel}"`);
    } else {
      page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
    }

    if (scoreBots[bearer[1].userid] && scoreBots[bearer[1].userid].channels && !scoreBots[bearer[1].userid].channels.includes(request.params.channel)) {
      scoreBots[bearer[1].userid].scoreBot.join(request.params.channel);
      page = page.replace(/#mescore#/g, `You are currently updating scores through your account. If you'd like to stop (and use zHekBot), click <a onclick="nomoscore()">here</a>`)
    } else if (bearer[1].tw_token) {
      var valid = true, newToken;

      axios.get('https://id.twitch.tv/oauth2/validate', {
        headers: {
          "Authorization": `OAuth ${bearer[1].tw_token}`
        }
      }).catch(async err => {
        if (err.toString().includes('401')) {
          var tokens = await helper.dbQueryPromise(`SELECT * FROM access_tokens WHERE userid = '${bearer[1].userid}';`)[0];
          if (!tokens) {
            console.log("No tokens returned - 2v2 refresh.");
            page = page.replace(/#mescore#/g, 'If you would like the scores to be updated through your account, click <a onclick="mescore()">here</a>');
          } else {

            axios.post('https://id.twitch.tv/oauth2/token', 
              `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${tokens.refresh_token}`,
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
                }
              }
            )
            .then(res => {
              var data = res.data;

              helper.dbQuery(`UPDATE permissions SET tw_token = '${data.access_token}' WHERE userid = '${bearer[1].userid}';`);
              helper.dbQuery(`UPDATE access_tokens SET access_token = '${data.access_token}', refresh_token = '${data.refresh_token}' WHERE userid = '${bearer[1].userid}';`);

              newToken = data.access_token;
              valid = false;
            })
            .catch(err => {
              helper.dbQuery(`UPDATE permissions SET tw_token = '' WHERE userid = '${bearer[1].userid}';`);

              helper.dumpError(err, "2v2 refresh token.");
              response.redirect('/');
            });

          }
        } else {
          helper.dbQuery(`UPDATE permissions SET tw_token = '' WHERE userid = '${bearer[1].userid}';`);

          helper.dumpError(err, "Validating 2v2.");
          response.redirect('/');
        }
      });

      scoreBots[bearer[1].userid] = {
        scoreBot: new tmi.Client({
          connection: {
            reconnect: true,
            secure: true
          },
          identity: {
            username: bearer[1].userid,
            password: valid?bearer[1].tw_token:newToken
          },
          channels: [ request.params.channel ]
        }),
        timeout: DateTime.now().plus({ minutes: 30 }).toMillis,
      };
      await scoreBots[bearer[1].userid].scoreBot.connect();
      page = page.replace(/#mescore#/g, `You are currently updating scores through your account. If you'd like to stop (and use zHekBot), click <a onclick="nomoscore()">here</a>`)
    } else {
      page = page.replace(/#CLIENT_ID#/g, process.env.CLIENT_ID + '');
      page = page.replace(/#mescore#/g, 'If you would like the scores to be updated through your account, click <a onclick="mescore()">here</a>');
    }

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

    // Check whether this user is in the local cache and has zHekBot enabled.
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner can use this path.
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if ((!rows[0] || !rows[1].perms || !rows[1].perms.split(',').includes(request.params.channel)) && rows[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Get 2v2 values in DB for this channel.
    var res = await helper.dbQueryPromise(`SELECT * FROM twovtwo WHERE userid = '${request.params.channel}';`);
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

    response.send(`${res[0].hkills},${res[0].tkills},${res[0].o1kills},${res[0].o2kills},${res[0].tname},${res[0].o1name},${res[0].o2name},${userIds[res[0].userid] && userIds[res[0].userid]["two_v_two"]},${userIds[res[0].tname] && userIds[res[0].tname]["two_v_two"] && rows[1].perms && rows[1].perms.split(',').includes(res[0].tname.toLowerCase())},${userIds[res[0].o1name] && userIds[res[0].o1name]["two_v_two"] && rows[1].perms && rows[1].perms.split(',').includes(res[0].o1name.toLowerCase())},${userIds[res[0].o2name] && userIds[res[0].o2name]["two_v_two"] && rows[1].perms && rows[1].perms.split(',').includes(res[0].o2name.toLowerCase())},${res[0].mapreset}`);
  } catch (err) {
    helper.dumpError(err, `2v2 scores.`);
    response.send(err.message);
  }
});


// Reset
app.get('/post/:channel/reset', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this user is in the local cache and has zHekBot enabled.
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner can use this path.
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if ((!rows[0] || !rows[1].perms || rows[1].perms.split(',').includes(request.params.channel)) && rows[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Reset values in DB.
    helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.params.channel}';`);
    if (userIds[request.get('tname')] && userIds[request.get('tname')]["two_v_two"] && rows[1].perms.split(',').includes(request.params.channel.toLowerCase())) {
      helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.get('tname')}';`)
    }
    if (userIds[request.get('o1name')] && userIds[request.get('o1name')]["two_v_two"] && rows[1].perms.split(',').includes(request.params.channel.toLowerCase())) {
      helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.get('tname')}';`)
    }
    if (userIds[request.get('o2name')] && userIds[request.get('o2name')]["two_v_two"] && rows[1].perms.split(',').includes(request.params.channel.toLowerCase())) {
      helper.dbQuery(`UPDATE twovtwo SET hKills = 0, tKills = 0, o1Kills = 0, o2Kills = 0 WHERE userid = '${request.get('tname')}';`)
    }

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `2v2 reset.`);
    response.sendStatus(500);
  }
});


// Automatic twovtwo turn off.
var duelOff = {};


// Enable/disable 2v2.
app.get('/post/:channel/enable', jsonParser, async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this user is in the local cache and has zHekBot enabled.
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner may use this path.
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if ((!rows[0] || !rows[1].perms || rows[1].perms.split(',').includes(request.params.channel)) && rows[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Enable/disable 2v2.
    if (request.get('enabled') === userIds[request.params.channel].two_v_two) {
      response.sendStatus(201);
    } else {
      helper.dbQuery(`UPDATE allusers SET two_v_two = ${!userIds[request.params.channel].two_v_two}::bool WHERE user_id = '${request.params.channel}';`);

      userIds[request.params.channel].two_v_two = !userIds[request.params.channel].two_v_two;

      if (duelOff[request.params.channel]) {
        clearTimeout(duelOff[request.params.channel]);
      }
      duelOff[request.params.channel] = setTimeout(function() { 
        userIds[request.params.channel].two_v_two = false;
        helper.dbQuery(`UPDATE allusers SET two_v_two = false::bool WHERE user_id = '${request.params.channel}';`);
      }, 60*15*1000);

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

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }

    // Check permissions. Editors and channel owner may use this path.
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if ((!rows[0] || !rows[1].perms || !rows[1].perms.split(',').includes(request.params.channel)) && rows[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Update scores in DB and put message to chat.
    await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.hKills}, tkills = ${request.params.tKills}, o1kills = ${request.params.o1Kills}, o2kills = ${request.params.o2Kills}, tname = '${request.get('tname')}', o1name = '${request.get('o1name')}', o2name = '${request.get('o2name')}', mapreset = ${parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.params.channel}';`);
    await tvtscores(request.params.channel.toLowerCase(), rows);

    if (request.get('tstatus') === 'true' && userIds[request.get('tname')] && userIds[request.get('tname')]["two_v_two"] && rows[1].perms.split(',').includes(request.get('tname'))) {
      await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.tKills}, tkills = ${request.params.hKills}, o1kills = ${request.params.o1Kills}, o2kills = ${request.params.o2Kills}, mapreset = ${parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.get('tname')}';`)
      await tvtscores('' + request.get('tname'), rows);
    }
    if (request.get('o1status') === 'true' && userIds[request.get('o1name')] && userIds[request.get('o1name')]["two_v_two"] && rows[1].perms.split(',').includes(request.get('o1name'))) {
      await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.o1Kills}, tkills = ${request.params.o2Kills}, o1kills = ${request.params.hKills}, o2kills = ${request.params.tKills}, mapreset = ${-1*parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.get('o1name')}';`)
      await tvtscores('' + request.get('o1name'), rows);
    }
    if (request.get('o2status') === 'true' && userIds[request.get('o2name')] && userIds[request.get('o2name')]["two_v_two"] && rows[1].perms.split(',').includes(request.get('o2name'))) {
      await helper.dbQueryPromise(`UPDATE twovtwo SET hkills = ${request.params.o2Kills}, tkills = ${request.params.o1Kills}, o1kills = ${request.params.hKills}, o2kills = ${request.params.tKills}, mapreset = ${-1*parseInt(request.get('mapreset') || '0')} WHERE userid = '${request.get('o2name')}';`)
      await tvtscores('' + request.get('o2name'), rows);
    }

    if (duelOff[request.params.channel]) {
      clearTimeout(duelOff[request.params.channel]);
      duelOff[request.params.channel] = setTimeout(function() { 
        userIds[request.params.channel].two_v_two = false;
        helper.dbQuery(`UPDATE allusers SET two_v_two = false::bool WHERE user_id = '${request.params.channel}';`);
      }, 60*15*1000);
    }

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `2v2 send scores.`);
    response.sendStatus(500);
  }
});


// Set up for user's score bot.
app.get('/twovtwo/:channel/mescore', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }

    // Check permissions. Editors may use this path to put scores out with their own username.
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if ((!rows[0] || !rows[1].perms || !rows[1].perms.split(',').includes(request.params.channel)) && rows[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }
    
    states[cookies['auth']] = request.get('state');

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err.message, "Me score.");
    response.sendStatus(500);
  }
});


// Stop scoring through editor's account.
app.get('/nomoscore', async (request, response) => {
  try {

    // Check permissions. 
    var cookies = request.cookies, rows;
    if (cookies["auth"]) {
      rows = await helper.checkBearer(cookies["auth"]);
      if (!rows[0]) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    if (scoreBots[rows[1].userid]) {
      await scoreBots[rows[1].userid].scoreBot.disconnect();
      helper.dbQuery(`UPDATE permissions SET tw_token = '' WHERE userid = '${rows[1].userid}';`);
    }

    response.sendStatus(200);
  } catch(err) {
    helper.dumpError(err, "Nomoscore.");
    response.sendStatus(500);
  }
});


// Wins for c_o_l_e
app.get('/wins/:user', async (request, response) => {
  try {
    var data = await lifetime(encodeURIComponent(request.params.user), 'uno');
    response.send(`I got ${data.lifetime.mode.br.properties.wins} dubskies!`);
  } catch (err) {
    helper.dumpError(err, `Wins web.`);
  }
});


// API endpoint to format ban statements for accounts in BrookeAB's chat which were created and followed within 6 hours. (for Adz)
app.get('/brookescribers', async (request, response) => {
  try {
    var time = Math.round(Date.now() / 1000) - 10800;

    // Pull accounts from database.
    var rows = await helper.dbQueryPromise(`SELECT * FROM brookescribers ORDER BY followed_at DESC;`);

    if (rows.length > 100) {
      rows = await helper.dbQueryPromise(`SELECT * FROM brookescribers WHERE followed_at > ${time} ORDER BY followed_at DESC;`);
    }

    // Format string of ban statements.
    var str = '';
    for (var i = 0; i < rows.length; i++) {
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


// Add placement suffix to number.
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

    // Check whether this channel is in the local cache.
    if (!userIds[request.params.channel]) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner can use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      var bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Set up page.
    var page = fs.readFileSync('./html/customs.html').toString('utf-8');
    page = page.replace(/Login to Twitch/g, "Logout of Twitch");
    page = page.replace(/#Placeholder#/g, userIds[request.params.channel.toLowerCase()]["pref_name"]);
    page = page.replace(/#channel#/g, userIds[request.params.channel].user_id);

    if (bearer[1].userid === request.params.channel) {
      page = page.replace(/#editors#/g, `href="/editors/${request.params.channel}"`);
      page = page.replace(/#permissions#/g, `href="/permissions/${request.params.channel}"`);
    } else {
      page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
    }

    // Currently disabled.
    // var rows = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${request.params.channel}';`);

    // var multis = [];
    // if (!rows || !rows.length) {
    //   multis.push('Multipliers not defined. Please use the !setmultipliers command in chat.');
    // } else {
    //   var raw = rows[0].multipliers.split(' ');
    //   for (var i = 0; i < raw.length/2; i++) {
    //     var temp = '';
    //     if (i + 1 >= raw.length/2) {
    //       temp = `${addEnd(raw[2*i])}+ : ${raw[2*i + 1]}x`;
    //     } else if (parseInt(raw[2*i]) + 1 === parseInt(raw[2*i + 2])) {
    //       temp = `${addEnd(raw[2*i])} : ${raw[2*i + 1]}x`;
    //     } else {
    //       temp = `${addEnd(raw[2*i])}-${addEnd(parseInt(raw[2*i + 2]) - 1)} : ${raw[2*i + 1]}x`;
    //     }
    //     multis.push(temp);
    //   }
    // }

    // page = page.replace(/#multipliers#/g, multis.join('<br>'));

    response.send(page);
  } catch (err) {
    helper.dumpError(err, `Customs scores.`);
    response.send(err.message);
  }
});


var customCd = {};


// Custom tourney update.
app.get ('/customs/update/:channel', async (request, response) => {
  try {
    request.params.channel = request.params.channel.toLowerCase();

    // Check whether this channel is in the database and has zHekBot in chat.
    if (!userIds[request.params.channel] || !userIds[request.params.channel].twitch) {
      response.status(404);
      response.redirect('/not-found');
      return;
    }
    
    // Check permissions. Editors and channel owner can use this path.
    var cookies = request.cookies;
    if (cookies["auth"]) {
      var bearer = await helper.checkBearer(cookies["auth"]);
      if ((!bearer[0] || !bearer[1].perms || !bearer[1].perms.split(',').includes(request.params.channel)) && bearer[1].userid !== request.params.channel) {
        response.status(401);
        response.redirect('/');
        return;
      }
    } else {
      response.status(401);
      response.redirect('/');
      return;
    }

    // Check whether this has been used too  recently.
    if (customCd[request.params.channel] && customCd[request.params.channel] > (Date.now()/1000)) {
      response.sendStatus(201);
      return;
    } else {
      customCd[request.params.channel] = (Date.now()/1000) + 3;
    }

    // Update DB and format for chat.
    var rows = await helper.dbQueryPromise(`SELECT * FROM customs WHERE user_id = '${request.params.channel}';`);

    var hKills = parseInt(request.get('hkills') || '0');
    var tKills = parseInt(request.get('tkills') || '0');
    var o1Kills = parseInt(request.get('o1kills') || '0');
    var o2Kills = parseInt(request.get('o2kills') || '0');
    var kills = hKills + tKills + o1Kills + o2Kills;

    var multis = rows[0].multipliers.split(' '), place = request.get('place') || '', placement = 0;
    for (var j = multis.length/2; j >= 0; j--) {
      
      if (parseInt(place) >= parseInt(multis[2*j])) {
        placement = parseFloat(multis[(2*j)+1]);
        break;
      }

    }
    
    say(request.params.channel, `Current Map | Kills: ${kills} | Score: ${(kills * placement).toFixed(2)}`, bot);

    response.sendStatus(200);
  } catch (err) {
    helper.dumpError(err, `Customs web page.`);
    response.send(err.message);
  }
});


// Get user's stats.
async function stats(username, platform) {
  try {
    var uriUser = encodeURIComponent(username);
    var time, lk, wk, wins, kills;

    var rows = await helper.dbQueryPromise(`SELECT * FROM stats WHERE acti_id = '${username}';`);

    if (!rows || !rows.length || rows[0].timeout < Date.now()/1000) {

      // Get stats.
      var data = await lifetime(uriUser, platform);

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
    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' ORDER BY timestamp DESC LIMIT 1;`);
    
    // If rows are empty, return.
    if (!rows.length) {
      console.log('No matches found.')
      return 'No matches found.';
    }

    // Get match object.
    var match = rows[0];

    // Format teammates, if any.
    var teammates = ' | Teammates: ';
    if (!match.teammates.length) teammates += '-';
    for (var i = 0; i < match.teammates.length; i++) { teammates += (!i?'':' | ') + `${match.teammates[i].name} (${match.teammates[i].kills}K, ${match.teammates[i].deaths}D)`; }
    
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
    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}';`);

    // Base values.
    var kGame = 0;
    var dGame = 0;
    var wins = 0;
    var streak = 0;
    var gulag_kills = 0;
    var gulag_deaths = 0;
    var lobby_kd = 0;
    var total = 0;

    // Increment stats.
    for (var i = 0; i < rows.length; i++) {
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
    var midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight};`);

    // Base values.
    var dailyGames = 0;
    var kGame = 0;
    var dGame = 0;
    var wins = 0;
    var streak = 0;
    var gulag_kills = 0;
    var gulag_deaths = 0;
    var lobby_kd = 0;
    var total = 0;

    // Increment stats.
    for (var i = 0; i < rows.length; i++) {
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
    var midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight} AND kills > ${userIds[username].bomb};`);

    // Base object.
    var bombs = [];

    // Increment stats.
    for (var i = 0; i < rows.length; i++) {
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
    var midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight};`);

    // Base object.
    var wins = [];

    // Increment stats.
    for (var i = 0; i < rows.length; i++) {
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
    var midnight = DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds() - userIds[username].time_offset || DateTime.now().setZone('America/Los_Angeles').startOf('day').toSeconds();

    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' AND timestamp > ${midnight};`);

    // Base values.
    var gulag_kills = 0;
    var gulag_deaths = 0;

    // Increment stats.
    for (var i = 0; i < rows.length; i++) {
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
    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${username}';`);

    var teammates = new Map();

    for (var i = 0; i < rows.length; i++) {
      var team = rows[i].teammates;
      if (!team.length) continue;

      for (var j = 0; j < team.length; j++) {
        var keyValue = teammates.get(team[j].name);
        teammates.set(team[j].name, keyValue?keyValue + 1:1);
      }
    }
    
    var sorted = Array.from(teammates.keys()).sort((a, b) => teammates.get(b) - teammates.get(a));
    
    var retStr = `Weekly Teammates | `;
    for (var i = 0; i < (sorted.length < 5?sorted.length:5); i++) {
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
    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${username}';`);

    var gamemodes = new Map();

    for (var i = 0; i < rows.length; i++) {
      var mode = rows[i].game_mode;

      var keyValue = gamemodes.get(mode);
      gamemodes.set(mode, keyValue?keyValue + 1:1);
    }
    
    var sorted = Array.from(gamemodes.keys()).sort((a, b) => gamemodes.get(b) - gamemodes.get(a));
    
    var retStr = `Weekly Game Modes | `;
    for (var i = 0; i < (sorted.length < 5?sorted.length:5); i++) {
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
    var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[username].acti_id}' ORDER BY timestamp DESC;`);

    var wins = 0, x = 0;
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
    var data = await lifetime('HusKerrs', 'uno');
    var semtex = data.lifetime.itemData.lethals['equip_semtex'].properties.kills;
    return `${semtex} kills with semtex huskKing`;
  } catch (err) {
    helper.dumpError(err, `Semtex.`);
    return '';
  }
};


// Format number with commas between each set of 3 numbers.
function numberWithCommas(x) {
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
  return x;
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


// Remove unused bots.
async function byeBots() {
  try {
    for (var i = 0; i < scoreBots.length; i++) {
      if (scoreBots[i].timeout >= DateTime.now().toMillis()) {
        await scoreBots[i].scoreBot.disconnect();
        delete scoreBots[i];
      }
    }
  } catch (err) {
    helper.dumpError(err.message, "Removing bots.");
  }
};


// Redirect to get access token for Twitch. Used for predictions currently, timeouts/bans may be added in the future.
app.get('/twitch/redirect', async (req, response) => {
  try {
    var query = url.parse(req.url, true).query;
    var state = query["state"];
    var cookies = req.cookies;

    if (state && states[cookies['auth']] === state) {
      var code = query["code"];

      await axios.post(`https://id.twitch.tv/oauth2/token`,
      `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=https://www.zhekbot.com/redirect`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(async resp => {
        var data = resp.data;

        await axios.get('https://id.twitch.tv/oauth2/validate',
        {
          headers: {
            'Authorization': 'OAuth ' + data.access_token
          }
        }).then(async resp2 => {
          var data2 = resp2.data;

          helper.dbQuery(`INSERT INTO access_tokens(userid, access_token, refresh_token, scope) 
            VALUES ('${data2.login}', '${data.access_token}', '${data.refresh_token}', '${data2.scopes.join(', ')}')
            ON CONFLICT (userid) DO UPDATE SET access_token = '${data.access_token}', refresh_token = '${data.refresh_token}', scope = '${data2.scopes.join(', ')}';`);
          
          if (data2.scopes.includes("chat:edit") || data2.scopes.includes("chat:read")) {
            var user = await helper.dbQueryPromise(`UPDATE permissions SET tw_token = '${data.access_token}' WHERE userid = '${data2.login}' RETURNING *;`);
            
            if (!user || !user[0]) throw new Error("Update did not return row.");

            if (!scoreBots[user[0].userid]) {
              scoreBots[user[0].userid] = {
                scoreBot: new tmi.Client({
                  connection: {
                    reconnect: true,
                    secure: true
                  },
                  identity: {
                    username: user[0].userid,
                    password: data.access_token
                  },
                  channels: [  ]
                }),
                timeout: DateTime.now().plus({ minutes: 30 }).toMillis,
              };
              await scoreBots[user[0].userid].scoreBot.connect();
            }
          }
        }).catch(err => {
          helper.dumpError(err, "Twitch redirect validate.");
        });
      }).catch(err => {
        helper.dumpError(err, "Twitch redirect token.");
      });
    } else {
      throw new Error("States do not match.");
    }

    response.redirect('/');
  } catch (err) {
    helper.dumpError(err, "Twitch redirect overall.");
    response.redirect('/');
  }
});


// Default not found page.
app.get("*", async (req, response) => {
  try {
    response.status(404);
    var page = fs.readFileSync("./html/not_found.html").toString('utf-8');

    let cookies = await req.cookies;

    if (cookies["auth"]) {
      page = page.replace('Login to Twitch', 'Logout of Twitch');

      let rows = await helper.checkBearer(cookies["auth"]);
      if (!rows[0]) {
        response.sendStatus(500);
        return;
      }

      page = page.replace('Login to Twitch', 'Logout of Twitch');
      page = page.replace(/#modules#/g, `href="/modules/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#twovtwo#/g, `href="/twovtwo/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#customs#/g, `href="/customs/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#editors#/g, `href="/editors/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#permissions#/g, `href="/permissions/${rows[1].userid.toLowerCase()}"`);
      page = page.replace(/#channel#/g, rows[1].userid.toLowerCase());
    } else {
      page = page.replace(/#modules#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#twovtwo#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#customs#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#editors#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#permissions#/g, 'style="color: grey; pointer-events: none;"');
      page = page.replace(/#channel#/g, 'zhekler');
      page = page.replace(/#CLIENT_ID#/g, process.env.CLIENT_ID || '');
    }
    response.send(page);
  } catch (err) {
    helper.dumpError(err, "Unknown page.");
  }
});


// Pull all matches in the last week.
async function weekMatches(userid) {
  try {
    var matches = [];

    var timestamp = parseInt((await helper.dbQueryPromise(`SELECT MIN(timestamp) FROM matches WHERE user_id = '${userIds[userid].acti_id}';`))[0].min) || DateTime.now().toSeconds();
    var weekAgo = DateTime.now().minus({weeks:1}).toSeconds() + userIds[userid].time_offset || DateTime.now().minus({weeks:1}).toSeconds();

    while (timestamp > weekAgo) {
      var data = (await date20(encodeURIComponent(userIds[userid].acti_id), userIds[userid].platform, timestamp)).matches;
      for (var i = 0; i < data.length; i++) {
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
    var onTwitch = await helper.dbQueryPromise(`SELECT * FROM allusers WHERE matches = true;`);
    for (var i = 0; i < onTwitch.length; i++) {
      if (userIds[onTwitch[i].user_id].matches && userIds[onTwitch[i].user_id].twitch && onTwitch[i].user_id !== 'zhekler' && (!online[onTwitch[i].user_id] || Date.now() > online[onTwitch[i].user_id])) {
        setTimeout(async () => {
          try {
            // Get time from a week ago and set base timestamp.
            console.log("Updating matches for " + onTwitch[i].acti_id);
            
            var weekAgo = (DateTime.now().minus({weeks:1}).toSeconds() + userIds[onTwitch[i].user_id].time_offset) || DateTime.now().minus({weeks:1}).toSeconds();
            var lastTimestamp = 0;
            
            // Clear matches which are older than a week.
            helper.dbQuery(`DELETE FROM matches WHERE timestamp < ${weekAgo} AND user_id = '${onTwitch[i].acti_id}';`);
            
            // If match cache for this user is empty, set it.
            var rows = await helper.dbQueryPromise(`SELECT * FROM matches WHERE user_id = '${userIds[onTwitch[i].user_id].acti_id}' ORDER BY timestamp DESC;`);
            
            // Update timestamp of last match.
            lastTimestamp = rows.length?rows[0].timestamp:lastTimestamp;
            
            // Fetch last 20 matches for user from COD API.
            var data;
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
            helper.dumpError(err, `Updating matches: ${onTwitch[i]}`);
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
    var timestamp, match_id, placement, kills, deaths, lobby_kd, game_mode;
    var gulag_kills = 0;
    var gulag_deaths = 0;
    var streak = 0;
    var addStr = [];

    if (!matches) return;
    for (var i = 0; i < matches.length; i++) {

      var data = (await apiAxios.get(`https://app.wzstats.gg/v2/?matchId=${matches[i].matchID}`)).data;
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
      var players = data.data.players || [];
      
      // Find user's team name.
      var teamName = '';
      for (var j = 0; j < players.length; j++) {
        if (players[j].playerMatchStat.player.uno === user.uno_id) {
          teamName = players[j].playerMatchStat.player.team;
          break;
        }
      }
      
      // Teammates?
      var teammates = [];
      for (var j = 0; j < players.length; j++) {
        if (players[j].playerMatchStat.player.team === teamName && players[j].playerMatchStat.player.uno !== user.uno_id) {
          var player = { 
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
var idArray = [], intArray = {};


app.post('/eventsub', async (req, res) => {
  try {
    var secret = getSecret();
    var message = getHmacMessage(req);
    var hmac = HMAC_PREFIX + getHmac(secret, message);  // Signature to compare

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {

      // Get JSON object from body, so you can process the message.
      var notification = req.body;
      
      if (idArray.includes(req.get(TWITCH_MESSAGE_ID))) {

        console.log("Duplicate event message.");
        res.send(201);

      } else if (new Date(TWITCH_MESSAGE_TIMESTAMP).getTime() + 10*60*1000 < Date.now()) {

        console.log("Expired event message.");
        res.send(202);

      } else {

        idArray.push(req.get(TWITCH_MESSAGE_ID));

        if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {

          var pred;

          console.log(`Event type: ${notification.subscription.type} for channel ${notification.event.broadcaster_user_login}.`);

          switch (notification.subscription.type) {

            // Post in chat for prediction beginning.
            case "channel.prediction.begin":
              pred = notification.event.title;
              var time = ((new Date(notification.event.locks_at)).getTime() - (new Date(notification.event.started_at)).getTime())/1000;
              say(notification.event.broadcaster_user_login, `NEW PREDICTION peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time} SECONDS peepoGamble DinkDonk 
                NEW PREDICTION peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time} SECONDS`, bot);
              if (time >= 60) {
                intArray[notification.event.broadcaster_user_login] = setTimeout(function () { 
                  say(notification.event.broadcaster_user_login, `GET YOUR BETS IN peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time/2} SECONDS peepoGamble DinkDonk 
                  GET YOUR BETS IN peepoGamble DinkDonk ${pred} peepoGamble DinkDonk ENDS IN ${time/2} SECONDS`, bot); 
                  delete intArray[notification.event.broadcaster_user_login];
                }, time*1000/2);
              }
              break;

            // Post in chat for prediction end.
            case "channel.prediction.end": 
              var outcome;
              for (var i = 0; i < notification.event.outcomes.length; i++) {
                if (notification.event.winning_outcome_id === notification.event.outcomes[i].id) {
                  outcome = notification.event.outcomes[i];
                  break;
                }
              }
              if (outcome) {
                var result = outcome.title;
                var topBetter = outcome.top_predictors[0];
                say(notification.event.broadcaster_user_login, `Prediction over! The result was '${result}'! ${topBetter.user_name?topBetter.user_name:topBetter.user_login} won ${numberWithCommas(topBetter.channel_points_won)} points!`, bot);
              } else {
                if (intArray[notification.event.broadcaster_user_login]) {
                  clearInterval(intArray[notification.event.broadcaster_user_login]);
                  delete intArray[notification.event.broadcaster_user_login];
                }
                say(notification.event.broadcaster_user_login, 'Prediction canceled! Points have been refunded.', bot);
              }
              break;

            // Post in chat for prediction lock.
            case "channel.prediction.lock":
              pred = notification.event.title;
              var points = 0;
              for (var i = 0; i < notification.event.outcomes.length; i++) {
                points += notification.event.outcomes[i].channel_points?notification.event.outcomes[i].channel_points:0;
              }
              if (intArray[notification.event.broadcaster_user_login]) {
                clearInterval(intArray[notification.event.broadcaster_user_login]);
                delete intArray[notification.event.broadcaster_user_login];
              }
              say(notification.event.broadcaster_user_login, `Prediction locked! There are ${numberWithCommas(points)} points on the line for '${pred}'`, bot);
              break;

            // Update local cache and DB that channel is online.
            case "stream.online":
              userIds[notification.event.broadcaster_user_login].online = true;
              helper.dbQuery(`UPDATE allusers SET online = true::bool WHERE user_id = '${notification.event.broadcaster_user_login}';`);
              if (online[notification.event.broadcaster_user_login]) delete online[notification.event.broadcaster_user_login];
              if (notification.event.broadcaster_user_login === 'huskerrs') {
                axios.get('https://api.twitch.tv/helix/channels?broadcaster_id=30079255', {
                  headers: {
                    "Authorization": "Bearer " + process.env.ACCESS_TOKEN,
                    "Client-Id": process.env.CLIENT_ID + ''
                  }
                })
                .then(res => {
                  let data = res.data.data;

                  // @ts-ignore
                  helper.discord.channels.cache.get('1016735961138335804').send(":twitch: Hey @everyone the main man is LIVE!!! click on the link and don't miss out on those amazing moments. :HuskLogo:");
                  // @ts-ignore
                  helper.discord.channels.cache.get('1016735961138335804').send({ embeds: [{
                    color: 3447003,
                    thumbnail: {
                      url: "https://www.zhekbot.com/images/HusKerrs-logo.png"
                    },
                    image: {
                      url: "https://www.zhekbot.com/images/HusKerrs-logo.png"
                    },
                    title: data[0].title,
                    url: "https://twitch.tv/huskerrs",
                    timestamp: new Date(),
                  }]});
                })
                .catch(err => {
                  helper.dumpError(err, "HusK notis.");
                })
              }
              break;

            // Update local cache and DB that channel is offline.
            case "stream.offline":
              userIds[notification.event.broadcaster_user_login].online = false;
              helper.dbQuery(`UPDATE allusers SET online = false::bool WHERE user_id = '${notification.event.broadcaster_user_login}';`);
              break;

            default: 
              console.log(`Unknown event: ${notification.subscription.type}`);
              break;
          }
          res.setHeader('Content-Type', 'text/html').sendStatus(204);

        } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {

          res.setHeader('Content-Type', 'text/html').status(200).send(notification.challenge);

        } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {

          res.setHeader('Content-Type', 'text/html').sendStatus(204);

          console.log(`${notification.subscription.type} notifications revoked!`);
          console.log(`reason: ${notification.subscription.status}`);
          console.log(`condition: ${JSON.stringify(notification.subscription.condition, null, 4)}`);

        } else {

          res.setHeader('Content-Type', 'text/html').sendStatus(204);
          console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
          
        }
      }
    }
    else {
      console.log('403');    // Signatures didn't match.
      console.log(message, hmac, req.headers[TWITCH_MESSAGE_SIGNATURE]);
      res.setHeader('Content-Type', 'text/html').sendStatus(403);
    }
  } catch (err) {
    helper.dumpError(err, "Event subscriptions.");
  }
})

// Get secret to be used in encryption.
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
var intervals = [];


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
    `grant_type=client_credentials&client_id=${client_config.client_id}&client_secret=${client_config.client_secret}`,
    { 
      headers: { responseType: 'json' }
  })
  .then(resp => {
    console.log(resp.data);
    for (var k in resp.data) {
      account_config[k] = resp.data[k];
    }

    symAxios.defaults.headers.common["Authorization"] = "Bearer " + account_config.access_token;
    console.log(symAxios.defaults);

    if (intervals["access_token"]) clearInterval(intervals["access_token"]);
    intervals["access_token"] = setInterval(function() {
      symAxios.get('https://id.twitch.tv/oauth2/validate', 
      {
        headers: {
          "Client-Id": process.env.CLIENT_ID || '',
          "Authorization": "Bearer " + account_config.access_token,
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
    
    var sixAgo = DateTime.now().setZone('America/Denver').minus({hours:6}).toMillis()/1000;

      // Get BrookeAB's last 20 followers.
      await symAxios.get('https://api.twitch.tv/helix/users/follows?to_id=214560121')
      .then(async resp => {
        try {
          // Pull most recent follower from database.
          helper.dbQuery(`DELETE FROM brookescribers WHERE created_at < ${sixAgo};`);
          var fRes = await helper.dbQueryPromise(`SELECT user_id FROM brookescribers;`);
          var fLast = []
          for (var i = 0; i < fRes.length; i++) fLast.push(fRes[i].user_id);

          // Set up temp storage.
          var temp = resp.data.data;
          var them = [];
          
          // Iterate through recent followers.
          for (var i = 0; i < temp.length; i++) {

            // If follower is more recent than those in the database and followed within six hours, check it's creation date.
            var followed = (new Date(temp[i].followed_at)).getTime()/1000;
            if (followed > sixAgo) {
              await symAxios.get(`https://api.twitch.tv/helix/users?id=${temp[i].from_id}`)
              .then(res2 => {
                if (res2.data.data[0]) {
                  var created = (new Date(res2.data.data[0].created_at)).getTime()/1000;
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

    // Populate match cache and initialize userIds map.
    var temp = await helper.dbQueryPromise(`SELECT * FROM allusers;`);
    for (var i = 0; i < temp.length; i++) {
      userIds[temp[i].user_id] = temp[i];
      if (temp[i].twitch) {
        // @ts-ignore
        bot.channels.push(temp[i].user_id);
        gcd[temp[i].user_id] = { };
      }
    };

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

    intervals["scoreBots"] = setInterval(byeBots, 60*15*1000);

    // Log into the COD API.
    await loginWithSSO(process.env.COD_SSO);

    // Set the 5 minute interval for each player being tracked and get their active elements.
    intervals["matches"] = setInterval(async() => { 
      try { 
        await updateMatches();
      } catch (err) {
        console.log(`Match intervals: ${err}`);
      }
    }, 300000);

  } catch (err) {

    // Clear intervals.
    for (var i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }

    // Log the error.
    helper.dumpError(err, "Everything error.");
  }
})();
