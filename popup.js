window.branches = [];
window.branchData = [];

window.onload = onWindowLoad;

function onWindowLoad() {

  $("#reset").click ( function() {
    // Clear everything except the settings
    var settings = null;
    getSettings();

    function getSettings() {
      chrome.storage.local.get("settings", function(data) {
        if(typeof data.branches == "object") {
          settings = data.settings;
        }
        clearData();
      });
    }
    function clearData() {
      chrome.storage.local.clear(function() {
        saveSettings();
      });
    }
    function saveSettings() {
      if ( settings ) {
        chrome.storage.local.set({settings: settings}, function() {
          alert("Data cleared");
        });
      }
    }




  });

  $("#help").click( function() {
    if ( $("#helpPanel").is(":visible") ) {
      $("#helpPanel").hide(100);
    } else {
      $("#helpPanel").show(100);
    }
  });

  $('body').on('click', 'a', function(){
     chrome.tabs.create({url: $(this).attr('href')});
     return false;
   });

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
