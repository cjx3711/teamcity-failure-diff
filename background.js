chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
      switch(message.type) {
          case "setCount":
              temp = message.count;
              break;
          default:
              console.error("Unrecognised message: ", message);
      }
  }
);
