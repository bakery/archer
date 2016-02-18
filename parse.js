#!/usr/bin/env node

var program = require('commander');
var _ = require('underscore');
// var cheerio = require('cheerio');
// var request = require('request');
var fs = require('fs');
// var slug = require('slug');
var xml2js = require('xml2js');
var path = require('path');

var processTranscript = function(rows){
  var newLineRxs = [
    /(>>\s*)*[a-zA-z]+:/ig,
    /[a-z]+:/g,
    /[A-Z]+:/g
  ];

  return _.reduce(rows, function(memo, row){
    var text = row['_'];
    var needNewLine = false;

    // figure out if we need a new line or just keep adding 
    // to the current buffer  

    for(var i=0; i<newLineRxs.length; i++){
      var rx = newLineRxs[i];
      if(rx.exec(text)){
        needNewLine = true;
        break;
      }
    }
     
    return memo.trim() + (needNewLine ? '\n' : ' ') + text;
  },'');
};

program.command('*').action(function(directory){
  var parser = new xml2js.Parser({
    emptyTag: ' '
  });


  fs.readdirSync(directory).forEach(function(file){
    console.error('processing', file);
    if (file.match(/\.xml$/)) {
      fs.readFile(path.join(directory, file), function(err, data) {
        // Preprocess xml data
        // - turn <tt:br/> into ' '
        // - clean up extra spaces

        var body = data.toString().replace(new RegExp('<tt:br/>', 'g'), ' ');
        body = body.replace(new RegExp('\s{2}','g'), ' ');


        parser.parseString(body, function (err, result) {
          var text = processTranscript(
            result['tt:tt']['tt:body'][0]['tt:div'][0]['tt:p']
          );

          var textFileName = path.join('./data/text', file.split('.xml')[0] + '.txt');

          fs.writeFile(textFileName, text, function(err) {
            if(err) {
              console.error('massive error', err);
              process.exit(1);
            } else {
              process.exit(0);
            }
          });
        });
      });
    }
  });
});
program.parse(process.argv);
