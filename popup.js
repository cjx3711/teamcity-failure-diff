window.branches = [];
window.branchData = [];

window.onload = onWindowLoad;

function onWindowLoad() {

  chrome.storage.local.get("branches", function(data) {
    console.log("Branches", data);
    if(typeof data.branches != "undefined") {
      branches = data.branches;
      getBranchData();
    }
  });
}

function getBranchData () {
  var completeData = 0;
  for ( var i = 0 ; i < window.branches.length; i++ ) {
    var branch = window.branches[i];
    var key = branch + "-data";
    chrome.storage.local.get(key, function(data) {
      if(typeof data[key] == "object") {
        window.branchData[branch] = data[key];
        console.log("Key " + key + " found");
      } else {
        console.log("Key " + key + " not found");
      }
      completeData++;
      if ( completeData >= window.branches.length ) {
        allDataRetrieved();
      }
    });
  }
}

function allDataRetrieved() {
  console.log("All data retrieved");
  console.log(window.branches);
  console.log(window.branchData);

  var options = [];
  for ( var i = 0 ; i < window.branches.length; i++ ) {
    var branch = window.branches[i];
    var text = branch;
    var branchData = window.branchData[branch];
    if ( branchData ) {
      text = text + " - " + branchData.build;
    }
    options.push( {value: branch, text: text });
  }
  setSelectOptions("#compareFrom", options);
  setSelectOptions("#compareTo", options);
}


function setSelectOptions(selectSelector, options) {
  var $selector = $(selectSelector);
  for ( var i = 0 ; i < options.length; i++ ) {
    $selector.append("<option value='"+options[i].value+"'>"+options[i].text+"</option>")
  }
}
