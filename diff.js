var other = [{"groupName":"GroupDiff::Show: - route","count":1,"items":["- route from the Node::Index page"]},{"groupName":"metrics: actions","count":1,"items":["actions manage actions"]},{"groupName":"node group: node-group-toolbar items","count":1,"items":["node-group-toolbar items should have defaults always at the top"]},{"groupName":"node index: bulk node operations: editing","count":1,"items":["editing cancel should not update nodes"]},{"groupName":"report_diff: url parameters to filter","count":1,"items":["url parameters to filter generating raw diff"]},{"groupName":"webscan: crcins: send an email of the pdf report","count":1,"items":["send an email of the pdf report successfully validate good emails for sending"]}];
var develop = [{"groupName":"blueprint_policies: existing policy","count":1,"items":["existing policy add to existing policy"]},{"groupName":"GroupDiff::Show: - route","count":1,"items":["- route from the Node::Index page"]},{"groupName":"metrics: actions","count":1,"items":["actions manage actions"]},{"groupName":"node group: node-group-toolbar items","count":1,"items":["node-group-toolbar items should have defaults always at the top"]},{"groupName":"webscan: crcins: send an email of the pdf report","count":1,"items":["send an email of the pdf report successfully validate good emails for sending"]}];

var merged = [];
for ( var i = 0; i < develop.length; i++ ) {
  var newItem = {
    groupName: develop[i].groupName, devItems: [], otherItems: []
  };
  merged.push(newItem);
  add(newItem.devItems, develop[i].items);
}

console.log(merged);

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

console.log(merged);
