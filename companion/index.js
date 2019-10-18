import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me } from "companion"; 
import {dataPoll, settingsPoll} from "./includes/polling";

//let bgDataType = JSON.parse(settingsStorage.getItem("dataType"));
var bgDataType = "mg/dl";
var sendSettings = true;

var bgDataUnits = "mg/dl";
var bgHighLevel = 0;
var bgLowLevel = 0;
var bgTargetTop = 0;
var bgTargetBottom = 0;
var bgTrend = "Flat";

var points = [220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220,220];
var currentTimestamp = Math.round(new Date().getTime()/1000);
var lastTimestamp = 0;
var dataUrl;
var settingsUrl;
var lastSettingsUpdate = 0;

messaging.peerSocket.onopen = () => {
  console.log("Companion Socket Open");
}

messaging.peerSocket.close = () => {
  console.log("Companion Socket Closed");
}



function buildSettings(settings) {
  // Need to setup High line, Low Line, Units.
  var obj = JSON.parse(settings);
//  console.log(JSON.stringify(obj));
  bgHighLevel = obj.settings.thresholds.highThreshold;
  bgLowLevel = obj.settings.thresholds.lowThreshold;
  bgDataUnits = obj.settings.glucoseUnits;
  
  const messageContent = {"settings": {
      "bgDataUnits" : bgDataUnits,
      "bgHighLevel" : bgHighLevel,
      "bgLowLevel" : bgLowLevel
    },
  }; // end of messageContent
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(messageContent);
  } else {
    console.log("companion - no connection");
    me.wakeInterval = 2000;
    setTimeout(function(){messaging.peerSocket.send(messageContent);}, 2500);
    me.wakeInterval = undefined;
  }
  return true;
}

function buildGraphData(data) {
  // Take the data in, move a step at a time from most recent back.
  // look at timestamps to determine if a missed poll happened and make that graph point disappear.
  let obj = JSON.parse(data);
  let graphpointindex = 0;
  var runningTimestamp = new Date().getTime();
  var indexarray = [];

  // build the index
  obj.sort(function(a, b) { 
    return b.date - a.date
   })
 
  let index = 0;
  let validTimeStamp = false;
//  console.log(JSON.stringify(obj));
  for (graphpointindex = 0; graphpointindex < 24; graphpointindex++) {
    if (index < obj.length) {
      while (((runningTimestamp - obj[index].date) >= 305000) && (graphpointindex < 24)) {
        points[graphpointindex] = undefined;
        runningTimestamp = runningTimestamp - 300000;
        graphpointindex++;
      }
      if(graphpointindex < 24) {
        points[graphpointindex] = obj[index].sgv;
       runningTimestamp = obj[index].date;
      }
        if (!validTimeStamp) {
        lastTimestamp = obj[index].date;
        bgTrend = obj[index].direction;
        validTimeStamp = true;
      }
    }
    index++
  }
  lastTimestamp = parseInt(lastTimestamp/1000, 10);
  var flippedPoints = points.reverse();
  const messageContent = {"bgdata" : {
      "graphData": flippedPoints, 
      "lastPollTime": lastTimestamp, 
      "currentTrend": bgTrend
    }
  };
  console.log(JSON.stringify(messageContent));
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(messageContent);
  } else {
    console.log("companion - no connection");
    me.wakeInterval = 2000;
    setTimeout(function(){messaging.peerSocket.send(messageContent);}, 2500);
    me.wakeInterval = undefined;
  }
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(messageContent);
  } else {
    console.log("companion - no connection");
    me.wakeInterval = 2000;
    setTimeout(function(){messaging.peerSocket.send(messageContent);}, 2500);
    me.wakeInterval = undefined;
  }
  return true;
}

function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {

    let key = settingsStorage.key(index);
      let data = {
        key: key,
        newValue: settingsStorage.getItem(key),
        dataType: true
      };

      if(key === "dataSourceURL") {
//        console.log("DataSourceURL: " + JSON.parse(settingsStorage.getItem(key)).name);
        dataUrl = JSON.parse(settingsStorage.getItem(key)).name;
      }else if(key === "settingsSourceURL") {
//        console.log("SettingsURL: " + JSON.parse(settingsStorage.getItem(key)).name);
        settingsUrl = JSON.parse(settingsStorage.getItem(key)).name;
      }else if(key === "unitsType") {
//        console.log("UnitsType: " + JSON.parse(settingsStorage.getItem(key)));
        bgDataType = JSON.parse(settingsStorage.getItem(key));
      }
  }
}

settingsStorage.onchange = function(evt) {
  restoreSettings();
  if (evt.key==="theme") {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      var data = JSON.parse(evt.newValue);
      var messageContent = {
        "theme" :
          data["values"][0].value
       };
      messaging.peerSocket.send(messageContent);
//      console.log("Sent Theme to watch:" + JSON.stringify(messageContent));
    } else {
      console.log("companion - no connection");
      me.wakeInterval = 2000;
      setTimeout(function(){var data = JSON.parse(evt.newValue); var messageContent = {"theme":[data["values"][0].value]}; messaging.peerSocket.send(messageContent);}, 2500);
      me.wakeInterval = undefined;
    }
  }
  if ((evt.key==="timeFormat")||(evt.key==="dateFormat")) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      var bgDisplayColor = settingsStorage.getItem("bgDisplayColor").replace(/^"(.*)"$/, '$1')
      var messageContent = {
        "bgDisplayColor" : bgDisplayColor
          
       };
      messaging.peerSocket.send(messageContent);
//      console.log("Sent bgTheme to watch:" + JSON.stringify(messageContent));
    } else {
      console.log("companion - no connection");
      me.wakeInterval = 2000;
      setTimeout(function(){var messageContent = {"bgDisplayColor":settingsStorage.getItem("bgDisplayColor")}; messaging.peerSocket.send(messageContent);}, 2500);
      me.wakeInterval = undefined;
    }
  }
}

messaging.peerSocket.onmessage = function(evt) {
  console.log(JSON.stringify(evt.data));
  if (evt.data.hasOwnProperty("RequestType")) {
  if (evt.data.RequestType === "Settings" ) {
    // Modify this to pass appropriate data in a single function instead of being lazy. 
    buildSettings(statusreply);
  }
  if (evt.data.RequestType === "Data" ) {
   dataPoll();
  }
  }  
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// var value = settingsPoll(dataPoll);
//setInterval(processDisplayData, 75000); // Run every 2.5 min.