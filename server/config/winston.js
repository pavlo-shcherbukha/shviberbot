var winston = require('winston');

var default_level = 'silly' ; 
const { createLogger, format, transports } = require('winston');

const { combine, timestamp,  printf, json } = format;
const jFormat =  combine(timestamp({format: 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ'}),json());
/*
//const { combine, timestamp,  printf, json } = jformat;
const myFormat = combine(  timestamp({format: 'YYYY-MM-DD HH:mm:ss'}), 
                           printf(({ level, message, label, state,timestamp }) => {
                                 return `[${timestamp}] [${level}] [${label}] [${state}] ${message}`;
                                 })
                        );

const jFormat =  combine(timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),json());
*/
const lhostname = process.env.HOSTNAME||'localhost' ;



// define the custom settings for each transport (file, console)
//hostname
var options = {
  file: {
    level: default_level ,
    filename: './logs/app-' + lhostname + '.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 20,
    colorize: false,
    format: jFormat,
  },
  console: {
    level: default_level ,
    handleExceptions: true,
    json: true,
    colorize: true,
    format: jFormat
  }
  
};



// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    //logger.silly(message);
  },
};

module.exports = logger;