const s3Queue = require("./s3Queue");
const emailQueue = require("./emailQueue");
const backupQueue = require("./backupQueue");

module.exports = {
    s3Queue,
    emailQueue,
    backupQueue
};
