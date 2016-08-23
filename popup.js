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

function getBranchData() {
  chrome.storage.local.get("branchData", function(data) {
    if(typeof data.branchData == "object") {
      window.branchData = data.branchData;
    }
    allDataRetrieved();
  });
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

  $("#diffIt").click( function() {
    var fromBranch = $("#compareFrom").val();
    var toBranch = $("#compareTo").val();
    console.log(fromBranch, toBranch);
    if ( fromBranch == toBranch ) {
      $("#sameBranch").show();
    } else {
      $("#sameBranch").hide();
    }
  })

  $("#reset").click ( function() {
    chrome.storage.local.clear(function() {
      alert("Data cleared");
    });
  });
}


function setSelectOptions(selectSelector, options) {
  var $selector = $(selectSelector);
  for ( var i = 0 ; i < options.length; i++ ) {
    $selector.append("<option value='"+options[i].value+"'>"+options[i].text+"</option>")
  }
}
