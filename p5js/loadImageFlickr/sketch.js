//laden van PNG, JPG, SVG en GIF

var imagesData = []; // array
var images = [];     // array
var loaded = false;  // boolean (2 states: true or false // 1 or 0 // HIGH or LOW)

/* WHAT ARE YOU SEARCHING FOR? */
var myTags = "gluon";


function preload(){ // doordat javascript asynchroon is moet je zeker zijn dat je beelden eerst geladen worden.

  queryFlickr(myTags, function(imgs){
    console.log('>>> got photos :', JSON.stringify(imgs, null, '\t'));

    imgs.forEach(function(img, i){
      /*img: { "id": "24764365331",
		  "url": "https://farm2.staticflickr.com/1481/24764365331_351e00dfdb_m.jpg",
		  "date": "2016:02:06 14:43:05",
		  "lat": "50 deg 51' 0.34\" N",
		  "lon": "4 deg 20' 59.51\" E" }*/
      imagesData.push(img);
      images.push(loadImage(img.url));
    });
    loaded = true;
    console.log('loaded!');
  });
}

function setup() {
  createCanvas(1000,800);
  background(0);
  fill(255);
  text("Loading images from Flickr...", 100, windowHeight/2);
}

function draw() {
  background(255);
  
  //only after loaded has completed, draw stuff
  if(loaded){
    var currX = 0;
    images.forEach(function(img, i){
      fill(255);
      
      // draw this img
      //image(img, currX, 0, img.width, img.height);
      
      tint(255, 185);  // Display at half opacity
      image(img, currX, currX, img.width*2, img.height*2);
      
      // draw img data
      fill(0);
      text("id: "+imagesData[i].id, width-100, img.height+15 );
      text("date: "+imagesData[i].date, width-100, img.height+30 );
      if(imagesData[i].lat){ //did we find lat/lon ?
        text("lat: "+imagesData[i].lat, width-100, img.height+45 );
        text("lon: "+imagesData[i].lon, width-100, img.height+60 );
      }
      // text("id: "+imagesData[i].id, currX+5, img.height+15 );
      // text("date: "+imagesData[i].date, currX+5, img.height+30 );
      // if(imagesData[i].lat){ //did we find lat/lon ?
      //   text("lat: "+imagesData[i].lat, currX+5, img.height+45 );
      //   text("lon: "+imagesData[i].lon, currX+5, img.height+60 );
      // }
      currX += 50;
      // currX += img.width; //add this img width to the X
    });
  }
}