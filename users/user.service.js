﻿const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const GetAddress = require('slp-cli-wallet/src/commands/get-address')
const getAddress = new GetAddress()
const SendBCH = require('_helpers/send-bch')
const sendBch_ = new SendBCH()

//const GetBalanceByAddress = require('slp-cli-wallet/src/commands/update-balances')
//const getbal = new GetBalanceByAddress()

const NETWORK = 'mainnet'
// REST API servers.
const BCHN_MAINNET = 'https://bchn.fullstack.cash/v4/'
const BCHJS = require('@psf/bch-js')
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: BCHN_MAINNET })
let txid
const filename = `${__dirname}/wallet.json`

module.exports = {
    authenticate,
    create,
    update,
   buyticket,
   withdraw,
   getbalance,
   getlastlottowinner,
   currentEntries,
   currentPrize
};

async function authenticate({ username, password }) {
    const user = await db.User.scope('withHash').findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.hash)))
        throw 'Username or password is incorrect';

    // authentication successful
    const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '7d' });
    return { ...omitHash(user.get()), token };
}



async function getAll() {
    return await db.User.findAll();
}

async function getById(id) {
    return await getUser(id);
}

async function create(params) {
    // validate
    if (await db.User.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }
    if (await db.User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already in use.';
    }

    if(params.password != params.confirmPassword) {
      throw 'Password must match.'
    }

    // hash password
    if (params.password) {
        params.hash = await bcrypt.hash(params.password, 10);
    }
    params.BCHAddress = await getAddress.getAddress(filename);
    params.Ticket = 0;
    // save user
    await db.User.create(params);
    //console.log(params.BCHAddress);
}

async function update(id, params) {
    const user = await getUser(id);

    // validate
    const usernameChanged = params.username && user.username !== params.username;
    if (usernameChanged && await db.User.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.hash = await bcrypt.hash(params.password, 10);
    }

    // copy params to user and save

    Object.assign(user, params);
    await user.save();

    return omitHash(user.get());
}


// helper functions

async function getUser(id) {
    const user = await db.User.findByPk(id);
    if (!user) throw 'User not found';
    return user;
}

async function buyticket(user,betAmount) {
  let date = new Date();

  if(date.getHours() < 23) {
 let current = await bchjs.Price.getBchUsd();
 let usdToSat = Math.round(1 / current * 100000000)
   const returnvalues = await sendBch_.SendBch(filename,user.BCHAddress,usdToSat,'bitcoincash:qrm9uly75rcn30f3v5amqy97dcn0zga2jqakkdmdu7')
   var obj = JSON.parse(returnvalues);
   var keys = Object.keys(obj);
   console.log(betAmount)
  let bchadd = user.BCHAddress
    if(obj[keys[1]]) {
      user.Ticket ++
      betAmount = Math.round(betAmount);
       await update(user.id,user)
        await db.connection.query(`INSERT INTO UserData . BCHAddresses  (BCHAddress,betNumber) VALUES ('${bchadd}',${betAmount});`);

      //  console.log(bchadd)
   } else {

     throw 'Purchase unsuccessful, please check your balance.';

   }
} else {
  throw 'Can not buy a ticket 1 hour before the draw'
}
   return user;



}


async function getbalance(user) {
  try {

    var balance = await bchjs.Electrumx.balance(user.BCHAddress)
   let current = await bchjs.Price.getBchUsd();

   balance = (balance.balance.confirmed + balance.balance.unconfirmed)/100000000  * current
  user.balance = balance


  return user

    }
    catch(err)
     {
  console.log(err);
    }

}


async function getlastlottowinner(txid) {

  try {
    const winnerTxid =   await db.connection.query(`SELECT * FROM UserData . WinnerTxid  WHERE id = 1 `)

      var str = JSON.stringify(winnerTxid[0])
      var obj = JSON.parse(str);
  var keys = Object.keys(obj);

       txid.txid = obj[keys[0]].TXID;

       return txid;


    }
    catch(err)
     {
  console.log(err);
    }
}

async function currentEntries(currentEntries) {

  try {

  entries = await db.connection.query(`SELECT COUNT(*) AS Count FROM UserData . BCHAddresses `)
  var cej = JSON.stringify(entries[0])
  var obj = JSON.parse(cej);
  var keys = Object.keys(obj);
    currentEntries.currentEntries = obj[keys[0]].Count

       return currentEntries

    }
    catch(err)
     {
  console.log(err);
    }
}

async function currentPrize(currentPrize) {

  try {

    var balance = await bchjs.Electrumx.balance('bitcoincash:qrm9uly75rcn30f3v5amqy97dcn0zga2jqakkdmdu7')
   let current = await bchjs.Price.getBchUsd();

   balance = (balance.balance.confirmed + balance.balance.unconfirmed)/100000000  * current

    currentPrize.currentPrize = balance

       return currentPrize

    }
    catch(err)
     {
  console.log(err);
    }
}




async function withdraw(user,withdrawaddress,withdrawamount) {
  let current = await bchjs.Price.getBchUsd();
  let usdToSat = Math.round(withdrawamount / current * 100000000)

const returnvals   =  await sendBch_.SendBch(filename,user.BCHAddress,usdToSat,withdrawaddress)
var obj = JSON.parse(returnvals);
var keys = Object.keys(obj);
    //console.log(purchase)
      if(!obj[keys[1]]) {
        throw 'Failed to withdraw, please check address format and balance.'
      }

}

function omitHash(user) {
    const { hash, ...userWithoutHash } = user;
    return userWithoutHash;
}
