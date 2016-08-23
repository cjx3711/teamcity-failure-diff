window.branches = [];
window.branchData = [];
function onWindowLoad() {
  var message = $('#message');
  var failures = $('#failures');

  // var windowVariables = retrieveWindowVariables(["failureData"]);
  console.log("Popup JS running");
  // message.text("Test stuff");

  chrome.storage.local.get("failures", function(data) {
    if(typeof data.failures != "undefined") {
      failures.val(JSON.stringify(data.failures))
    }
  });

  chrome.storage.local.get("branches", function(data) {
    console.log("Branches", data);
    if(typeof data.branches != "undefined") {
      message.html(data.branches.join("<br/>"));
      branches = data.branches;
      getBranchData();
    }
  });


}

function getBranchData () {
  for ( var i = 0 ; i < window.branches.length; i++ ) {
    var branch = window.branches[i];
    var key = branch + "-data";
    chrome.storage.local.get(key, function(data) {
      if(typeof data[key] == "object") {
        window.branchData.push(data[key]);
        console.log("Key " + key + " found");
      } else {
        console.log("Key " + key + " not found");
      }
    });
  }
}


window.onload = onWindowLoad;
