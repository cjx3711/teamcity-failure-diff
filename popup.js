window.STATE_LOADING = 0;
window.STATE_SETUP = 1;
window.STATE_MAIN = 2;

window.branches = [];
window.branchData = [];
window.state = window.STATE_LOADING;
window.settings = {
  jiraSite: null,
  skippedSetup: false
};
window.onload = onWindowLoad;

function onWindowLoad() {
  updateState();

  $('body').on('click', '#reset', resetClickHandler );
  $('body').on('click', "#help", helpClickHandler );

  $('body').on('click', "#choose-button", laterClickHandler );
  $('body').on('click', "#later-button", laterClickHandler );
  $('body').on('click', "#run-setup-button", runSetupClickHandler );

  // Clicking on any <a> tag will open a new tab
  $('body').on('click', 'a', function(){
     chrome.tabs.create({url: $(this).attr('href')});
     return false;
   });

  // Get the branch data;
  chrome.storage.local.get("branches", function(data) {
    console.log("Branches", data);
    if(typeof data.branches != "undefined") {
      branches = data.branches;
      getBranchData();
    } else {
      allDataRetrieved();
    }
  });
}

function getBranchData() {
  chrome.storage.local.get("branchData", function(data) {
    if(typeof data.branchData == "object") {
      window.branchData = data.branchData;
    }
    getSettings();
  });
}

function getSettings() {
  chrome.storage.local.get("settings", function(data) {
    if(typeof data.settings == "object") {
      window.settings = data.settings;
    } else {
      saveSettings();
    }
    allDataRetrieved();
  });
}

function saveSettings() {
  chrome.storage.local.set({settings: window.settings});
}

function allDataRetrieved() {
  console.log("All data retrieved");
  console.log(window.branches);
  console.log(window.branchData);
  console.log(window.settings);

  if ( !window.settings.jiraSite && !window.settings.skippedSetup ) {
    window.state = window.STATE_SETUP;
  } else {
    window.state = window.STATE_MAIN;
  }
  updateState();

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
      $("#diffPanel").hide();
    } else {
      $("#sameBranch").hide();
      $("#diffPanel").show();

      var fromBranchData = window.branchData[fromBranch];
      var toBranchData = window.branchData[toBranch];
      var merged = merge(fromBranchData.failures, toBranchData.failures);
      console.log(merged);
      displayDiffData(merged, fromBranch, toBranch, fromBranchData.link, toBranchData.link );
    }
  })

}

function setSelectOptions(selectSelector, options) {
  var $selector = $(selectSelector);
  for ( var i = 0 ; i < options.length; i++ ) {
    $selector.append("<option value='"+options[i].value+"'>"+options[i].text+"</option>")
  }
}

function updateState() {
  var $loadingContainer = $("#loading-container");
  var $setupContainer = $("#setup-container");
  var $mainContainer = $("#main-container");
  $loadingContainer.hide();
  $setupContainer.hide();
  $mainContainer.hide();
  switch ( window.state ) {
    case window.STATE_LOADING:
      $loadingContainer.show();
    break;
    case window.STATE_SETUP:
      $setupContainer.show();
    break;
    case window.STATE_MAIN:
      $mainContainer.show();
    break;
  }
}

function displayDiffData(merged, leftBranch, rightBranch, leftLink, rightLink) {
  var $differences = $("#differences");
  $differences.html('');
  for ( var i = 0 ; i < merged.length; i++ ) {
    var group = merged[i];
    var $row = $("<div class='row'></div>");
    var $title = $("<div class='col-xs-12'><strong>"+group.groupName+"</strong></div>");
    var $devItems = $("<div class='col-xs-6'></div>");
    var $otherItems = $("<div class='col-xs-6'></div>");
    for ( var j = 0; j < group.devItems.length; j++ ) {
      var $item = $("<div class=''>"+group.devItems[j]+"</div>");
      $devItems.append($item);
    }
    if ( group.devItems.length == 0 ) {
      $devItems.append("<em>nil</em>");
    }
    for ( var j = 0; j < group.otherItems.length; j++ ) {
      var $item = $("<div class=''>"+group.otherItems[j]+"</div>");
      $otherItems.append($item);
    }
    if ( group.otherItems.length == 0 ) {
      $otherItems.append("<em>nil</em>");
    }
    $row.append($title);
    $row.append($devItems);
    $row.append($otherItems);
    $differences.append($row);
    $differences.append("<hr/>");
  }

  // Generate stats
  var total = 0;
  var leftCount = 0;
  var rightCount = 0;
  for ( var i = 0 ; i < merged.length; i++ ) {
    total += merged[i].devItems.length + merged[i].otherItems.length;
    leftCount += merged[i].devItems.length;
    rightCount += merged[i].otherItems.length;
  }
  $("#totalCount").text(total);
  $("#leftCount").text(leftCount);
  $("#rightCount").text(rightCount);
  $("#leftBranch").text(leftBranch);
  $("#rightBranch").text(rightBranch);
  $("#leftLink").attr('href', leftLink);
  $("#rightLink").attr('href', rightLink);
}

// Merging logic
function merge(develop, other) {
  var merged = [];
  for ( var i = 0; i < develop.length; i++ ) {
    var newItem = {
      groupName: develop[i].groupName, devItems: [], otherItems: []
    };
    merged.push(newItem);
    add(newItem.devItems, develop[i].items);
  }

  // Merge the first layer
  for ( var i = 0; i < other.length; i++ ) {
    var otherElement = other[i];
    var group = find ( merged, "groupName", otherElement.groupName);
    if ( group == null ) {
      merged.push({
        groupName: otherElement.groupName, devItems: [], otherItems: otherElement.items
      });
    } else {
      console.log(group);
      add(group.otherItems, otherElement.items);
    }
  }

  // Merge the second layer
  for ( var i = 0; i < merged.length; i++ ) {
    for ( var j = 0; j < merged[i].devItems.length; ) {
      console.log("Looking for ", merged[i].devItems[j]);
      var index = merged[i].otherItems.indexOf(merged[i].devItems[j]);
      if ( index >= 0 ) {
        console.log("Found");
        merged[i].otherItems.splice(index, 1);
        merged[i].devItems.splice(j, 1);
      } else {
        j++;
      }
    }
  }

  // Remove empty ones
  for ( var i = 0; i < merged.length; ) {
    if ( merged[i].devItems.length == 0 && merged[i].otherItems.length  == 0 ) {
      merged.splice(i,1);
    } else {
      i++;
    }
  }

  return merged;

  function add( array, otherArray ) {
    for ( var i = 0; i < otherArray.length; i++ ) {
      array.push(otherArray[i]);
    }
  }
  function find( array, key, value ) {
    for ( var i = 0; i < array.length; i++ ) {
      if ( array[i].hasOwnProperty(key) && array[i][key] == value ) {
        return array[i];
      }
    }
    return null;
  }
}


// --------- CLICK HANDLERS -----------
// ------------------------------------

function helpClickHandler() {
  if ( $("#helpPanel").is(":visible") ) {
    $("#helpPanel").hide(100);
  } else {
    $("#helpPanel").show(100);
  }
}
function resetClickHandler() {
  // Clear everything except the settings
  chrome.storage.local.clear(function() {
    saveSettings();
    alert("Data cleared");
  });
}

function laterClickHandler() {
  window.settings.skippedSetup = true;
  saveSettings();
  window.state = window.STATE_MAIN;
  updateState();
}

function runSetupClickHandler() {
  window.settings.skippedSetup = false;
  saveSettings();
  window.state = window.STATE_SETUP;
  updateState();
}
