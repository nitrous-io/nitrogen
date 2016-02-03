module.exports = {
  secondsToTime(seconds) {
    switch (true) {
      case seconds === 1:
        return "1 second";
      case seconds < 60:
        return seconds + " seconds";
      case seconds < 60*2:
        return "1 minute";
      case seconds < 60*60:
        return Math.floor(seconds/60) + " minutes";
      case seconds < 60*60*2:
        return "1 hour";
      default:
        return Math.floor(seconds/60/60) + " hours";
    }
  }
};
