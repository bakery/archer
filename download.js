#!/usr/bin/env node

var program = require('commander');
var _ = require('underscore');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var slug = require('slug');

var getEpisodeMetadata = function(data){
  var seasonInfo = _.find(data.catalogMetadata.family.tvAncestors, function(tva){
    return tva.catalog && tva.catalog.seasonNumber;
  });
  return {
    title : data.catalogMetadata.catalog.title,
    episodeNumber : data.catalogMetadata.catalog.episodeNumber,
    seasonNumber : seasonInfo.catalog.seasonNumber
  };
};

var getEpisodeSubtitlesURL = function(data){
  var sbts = _.find(data.subtitleUrls, function(s){
    return s.languageCode === 'en-US';
  });
  return sbts && sbts.url;
};

var downloadAndSaveSubtitles = function(episodeData){
  var filePath = [
    './data/s', episodeData.seasonNumber,
    'e', episodeData.episodeNumber,
    '-', slug(episodeData.title), 
    '.xml'
  ].join('');

  console.error('downloading episode subtitles from',
    episodeData.subtitles, 'to', filePath);
  
  request(episodeData.subtitles, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile(filePath, body, function(err) {
        if(err) {
          console.error('massive error', err);
          process.exit(1);
        } else {
          process.exit(0);
        }
      }); 
    }
  });
};

program.command('*').action(function(url){
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      var episodeData = _.extend({}, getEpisodeMetadata(data), {
        subtitles : getEpisodeSubtitlesURL(data)
      });
      downloadAndSaveSubtitles(episodeData);
    }
  });
});
program.parse(process.argv);
