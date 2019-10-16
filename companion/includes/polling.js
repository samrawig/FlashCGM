export const dataPoll = () => {
    dataUrl = JSON.parse(settingsStorage.getItem("dataSourceURL")).name;
    if (dataUrl == "" || dataUrl == null) {
      dataUrl = "http://127.0.0.1:17580/sgv.json?count=24&brief_mode=Y";
    }
    console.log('Open Data API CONNECTION');
    console.log(dataUrl);
    if(dataUrl) {
      fetch(dataUrl,{
        method: 'GET',
        mode: 'cors',
        headers: new Headers({
          "Content-Type": 'application/json; charset=utf-8'
        })
      })
        .then(response => {
   //       console.log('Get Data From Phone');
          response.text().then(data => {
            console.log('fetched Data from API');
            let obj = JSON.parse(data);
            let returnval = buildGraphData(data);
          })
          .catch(responseParsingError => {
            console.log("Response parsing error in data!");
            console.log(responseParsingError.name);
            console.log(responseParsingError.message);
            console.log(responseParsingError.toString());
            console.log(responseParsingError.stack);
          });
        }).catch(fetchError => {
          console.log("Fetch Error in data!");
          console.log(fetchError.name);
          console.log(fetchError.message);
          console.log(fetchError.toString());
          console.log(fetchError.stack);
        })
    } else {
      console.log('no url stored in settings to use to get data.');
    }
    return true;
  };
  
  export const settingsPoll = () => {
    if ((lastSettingsUpdate+3600) <= (Date.now()/1000)) {
      settingsUrl = JSON.parse(settingsStorage.getItem("settingsSourceURL")).name;
      if (settingsUrl == "" || settingsUrl == null) {
        settingsUrl = "http://127.0.0.1:17580/status.json";
      }
      console.log('Open Settings API CONNECTION');
      console.log(settingsUrl);
      if (settingsUrl) {
        fetch(settingsUrl, {
          method: 'GET',
          mode: 'cors',
          headers: new Headers({
            "Content-Type": 'application/json; charset=utf-8',
          }),
        })
          .then(response => {
     //       console.log('Get Settings From Phone');
            response.text().then(statusreply => {
              console.log("fetched settings from API");
              lastSettingsUpdate = Date.now()/1000;
              let returnval = buildSettings(statusreply);
            })
              .catch(responseParsingError => {
                console.log('Response parsing error in settings!');
                console.log(responseParsingError.name);
                console.log(responseParsingError.message);
                console.log(responseParsingError.toString());
                console.log(responseParsingError.stack);
              });
          }).catch(fetchError => {
            console.log('Fetch error in settings!');
            console.log(fetchError.name);
            console.log(fetchError.message);
            console.log(fetchError.toString());
            console.log(fetchError.stack);
          });
      } else {
        console.log("no url stored in app settings to use to get settings.");
      }
    } else {
    }
    return true;
  };