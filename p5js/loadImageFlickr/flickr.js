
var API_KEY = '2d624fff40205edcdcf5155d276e9c89';

var PIETER_USER_ID = '139152471@N06';
var JOE_USER_ID = '43854009@N05';


var photoQuery = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key="+API_KEY+"&jsoncallback=?";
// var photoQuery = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";
var geoQuery = "https://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation&api_key="+API_KEY+"&jsoncallback=?";
//var exifQuery = "https://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key="+API_KEY+"&jsoncallback=?";

//size of photos to query for: https://www.flickr.com/services/api/misc.urls.html
var PHOTO_SIZE = 'm'; //c = medium (800px longest side), o = original

function queryFlickr(_tags, callback){
  $.getJSON( photoQuery, {
    user_id: PIETER_USER_ID,
    tags: _tags,
    tag_mode: "all", //any
    per_page: 5,
    extras: 'date_taken',
    format: "json"
  })
  .done(function(data){
    console.log('data:'+JSON.stringify(data));
    queryExifs(data.photos.photo, callback);
  });
}

function queryExifs(photos, cb){
  console.log('found >> '+photos.length+' << photos:');
  // console.log(photos);
  var foundPhotos = [];

  async.mapSeries(photos, getExif, function(e, results){
    // console.log('all photos array:', results);
    cb(results);
  });


  function getExif(photo, cb){
    // console.log('querying EXIF for: '+JSON.stringify(photo, null, '\t'));
    console.log('getting GEO for id: '+photo.id);
    var photoId = photo.id;
    var photoData = {
      id: photoId,
      date: photo.datetaken,
      url: 'https://farm'+photo.farm+'.staticflickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'_'+PHOTO_SIZE+'.jpg'
    };

    $.getJSON( geoQuery, {
      photo_id: photoId,
      extras: "url_c", /* NOT WORKING WTF */
      format: "json"
    })
    .done(function(thisPhoto){
      console.log(thisPhoto);
      if(thisPhoto.stat === 'ok'){
        photoData.lat = thisPhoto.photo.location.latitude;
        photoData.lon = thisPhoto.photo.location.longitude;
      }
      cb(null, photoData);
    });
  }
}



      // async.eachSeries(thisPhoto.photo.exif, function(data, callb){
      //   if(data.tag === 'GPSLatitude'){
      //     // console.log('GOT LATITUDE:', data.clean._content);
      //     photoData.lat = data.clean._content;
      //   } else if(data.tag === 'GPSLongitude'){
      //     // console.log('GOT LONGITUDE:', data.clean._content);
      //     photoData.lon = data.clean._content;
      //   } else if(data.tag === 'CreateDate'){
      //     // console.log('CREATEDATE:', data.raw._content);
      //     photoData.date = data.raw._content;
      //   }
      //   callb();
      // }, function(e){
      //   console.log('-- success photoId: '+photoId);
      //   cb(null, photoData);
      // });