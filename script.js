// alert("Script loaded");
var failures = [];
var branch = jQuery("span.branch a.branchName").text();
var build = jQuery("ul#mainNavigation .last a").clone().children().remove().end().text();
// debugger
jQuery('.blockHeader').each(function(index, element) {
  var $element = jQuery(element);
  var header = $element.text();
  if ( header.includes("tests failed")) {
    // Get the sibling
    var $sibling = $element.next();
    $testContainer = $sibling.find('.group-div');
    $groupNameList = $testContainer.find('.group-name');
    for ( var i = 0 ; i < $groupNameList.length; i++ ) {
      var $groupNameElement = jQuery($groupNameList[i]);
      var newGroupItem = {
        groupName: $groupNameElement.text().replace(/\s+/g, ' ').replace(/\(\d+\)\s?$/, '').trim(),
        count: 0,
        items: []
      };
      failures.push( newGroupItem );
      var $groupTable = $groupNameElement.next(".testList");
      var $testList = $groupTable.find(".testRow");
      for ( var j = 0; j < $testList.length; j++ ) {
        var $testElement = jQuery($testList[j]);
        var testName = $testElement.find("a.testWithDetails").text().replace(/\s+/g, ' ').trim();
        newGroupItem.items.push(testName);
        newGroupItem.count++;
      }
    }
  }
});


if ( typeof failures != "object" || failures.length == 0 || !branch || !build ) {
  console.log("Failed to scrape the data");
} else {
  console.log("Data scraped");
  // Save the data
  var key = branch + "-data";
  var data = {};
  data[key] = {
    branch: branch,
    failures: failures,
    build: build
  };
  chrome.storage.local.set(data);

  var branches = [];
  chrome.storage.local.get("branches", function(data) {
    if(typeof data.branches == "object") {
      branches = data.branches
    }
  });
  if ( !branches.includes(branch) ) {
    branches.push(branch);
  }
  chrome.storage.local.set({branches: branches});
  console.log("Branches set", branches);

  chrome.storage.local.get(key, function(data) {
    console.log("Getting data key");
    if(typeof data[key] == "object") {
      console.log(data[key]);
    }
  });
}
