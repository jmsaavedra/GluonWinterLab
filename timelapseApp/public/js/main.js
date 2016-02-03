
/* session vars */
var pageSize = 4; //how many images per page to show
var totalPages;
var currentPage;
var allImages = [];
var IMAGE_TAKER = false;
var image_count = 0;
var countdownInterval;


var socket = io.connect(window.location.hostname+':8080');

socket.on('image_count', function(count){
  console.log('got image count: '+count);
  image_count = count;
  $('.img-ct').html('<strong>Num Images Captured Today</strong>: &emsp;'+count);
});

socket.on('new-image', function(image){
  allImages.push(image);
  console.log(">> socket.on: new-image, allImages length: "+allImages.length);
});

socket.on('finished', function(latestImages, date, nextSnapTime){
  console.log("socket: finished");
  console.log('recieved images:',JSON.stringify(latestImages));
  console.log('nextSnapTime: ',nextSnapTime)
  allImages = latestImages;
  loadImages(0, function(){});
  initCountdown(nextSnapTime);

  $('.date').html('<strong>Today\'s Date</strong>:&emsp;'+date);
  $('#errorDialog').modal('hide');
  $('#processingDialog').modal('hide');
  $('#restartDialog').modal('hide');
});


socket.on('loading', function(){
  console.log('received loading...');
  $('.loading-msg').text('');
  clearInterval(countdownInterval);
  $('#errorDialog').modal('hide');
  $('#processingDialog').modal('show');
});

socket.on('process_msg', function(msg){
  $('.loading-msg').append("<br>√ "+msg);
});


socket.on('error', function(msg){
  console.log('received error...',msg);
  
  $('#processingDialog').modal('hide');
  $('#restartDialog').modal('hide');
  $('#errorDialog').modal('show');
  $('.error-msg').text(msg);
});



socket.on('init', function(latestImages, date, nextSnapTime){
  console.log("socket: finished");
  console.log('recieved images:',JSON.stringify(latestImages));
  initCountdown(nextSnapTime);
  allImages = latestImages;
  loadImages(0, function(){});
  
  $('.date').html('<strong>Today\'s Date</strong>:&emsp;'+date);
  $('#errorDialog').modal('hide');
  $('#processingDialog').modal('hide');
  $('#restartDialog').modal('hide');
});


function initCountdown(eventTime){
  moment().local();
  clearInterval(countdownInterval);
  console.log('init countdown to: '+eventTime);
  console.log('moment says: '+moment(eventTime));
  $('.next-snap').html('<strong>Next Scheduled Snap</strong>:&emsp;'+moment(eventTime).local().format('YYYY-MM-DD, hh:mm:ss'));

  // var currentTime = new Date(); // Timestamp - Sun, 21 Apr 2013 12:30:00 GMT
  var diffTime = moment(eventTime) - moment(new Date());
  var duration = moment.duration(diffTime+500, 'milliseconds');
  var interval = 1000;
  

  countdownInterval = setInterval(function(){
    duration = moment.duration(duration - interval, 'milliseconds');
    var timeString = "<strong>Snap Countdown</strong>:&emsp;";
      if(duration.days() >= 1) timeString += duration.days()+' days ';
      if(duration.hours() >= 1) timeString += duration.hours()+' hours ';
      if(duration.minutes() >= 1) timeString += duration.minutes()+' minutes ';
      timeString += duration.seconds()+' secs';
      $('.countdown').html(timeString);
  }, interval);
}

$(document).ready(function(){
  console.log("pageSize: "+pageSize + " imgs per page");
  
  $('.take-photo').click(function(e){
    IMAGE_TAKER = true;
    $('#processingDialog').modal('show');
    socket.emit('snap',{snap: 0});
  });

  $('.restart').click(function(e){
    $('#restartDialog').modal('show');
    socket.emit('restart',{restart: 1});
    $('.no-images').show();
  });

});


var loadImages = function(idx, cb){
  console.log("loadImages, idx: "+idx);
  if (allImages.length > 1) $('.no-images').hide();
  var imagesHolder = document.getElementsByClassName("images")[0];
  clearHolder(imagesHolder, function(){
    for(var j=0; j<pageSize; j++){
      if(j < allImages.length){ //partial page (if last page has less than full pageSize)
        //console.log('allImages['+j+']');
        var thisImage = new ImageElement(allImages[j]);
        imagesHolder.appendChild(thisImage);//, imagesHolder.firstChild);
      }
    } 
    IMAGE_TAKER = false;

    cb();
  });
};


var clearHolder = function(holder, cb){
  while (holder.firstChild) {
    holder.removeChild(holder.firstChild); //clear out all current images
  }
  // return true;
  cb();
};







var ImageElement = function(image){
  // console.log("IMAGE : "+JSON.stringify(image,null,'\t'));
  this.imgHolder = document.createElement("div");
  this.imgHolder.className = "image col-xs-12 col-sm-6 col-md-6 col-lg-6 "+image.camera;

  this.thumbHolder = document.createElement("div");
  this.thumbHolder.className = "thumbnail";

  this.img = document.createElement("img");
  this.img.src = 'images/'+image.path;

  this.caption = document.createElement("div");
  this.caption.className = "caption";

  this.caption.appendChild(new _ButtonToolbar(image));
  //this.caption.appendChild(this.imgLabel);

  this.thumbHolder.appendChild(this.img);
  this.thumbHolder.appendChild(this.caption);
  this.imgHolder.appendChild(this.thumbHolder);

  //console.log(this);
  return this.imgHolder;
};

var _ButtonToolbar = function(image){

  this.btntoolbar = document.createElement("div");
  this.btntoolbar.className = "btn-toolbar";
  this.btntoolbar.setAttribute("role", "toolbar");

  this.btngroup = document.createElement("div");
  this.btngroup.className = "btn-group";
  // this.btngroup.setAttribute("role", "group");

  var camNumLabel = 'Camera '+ (parseInt(image.path[image.path.length-5])+1);
  this.btngroup.appendChild(document.createTextNode(camNumLabel));
  // this.btngroup.appendChild(new _Button(image,'details', 'search',false));
  // this.btngroup.appendChild(new _Button(image,'approve', 'ok', image.approved));
  // this.btngroup.appendChild(new _Button(image,'heart', 'heart', image.hearted));

  this.imagePath = document.createTextNode(image.path);
  this.imgLabel = document.createElement("p");

  this.imgLabel.appendChild(this.imagePath);

  this.imgLabel.className = "inverse image-path";

  this.btntoolbar.appendChild(this.btngroup);
  this.btntoolbar.appendChild(this.imgLabel);

  return this.btntoolbar;
};



var _Button = function(image,cl,glyph,state){
  var _this = this;
  this.span = document.createElement("span");
  this.span.className = "glyphicon glyphicon-"+glyph;

  this.btn = document.createElement("button");

  if(cl === 'approve') this.btn.className = (state)? "btn btn-primary "+cl+" active" : "btn btn-default "+cl+" inactive";
  else if(cl === 'heart') this.btn.className = (state)? "btn btn-danger "+cl+" active" : "btn btn-default "+cl+" inactive";
  else this.btn.className = (state)? "btn btn-default "+cl+" disabled" : "btn btn-default "+cl;

  this.btn.setAttribute("role", "button");
  this.btn.setAttribute("type", "button");
  if(state === false){
    this.btn.addEventListener("click",function(e){
      switch(cl){
        case 'approve':
            socket.emit(cl,{_id: image._id});
            image.approved = true;
            _this.btn.className = "btn btn-primary "+cl+" active";
          break;
        case 'heart':
            socket.emit(cl,{_id: image._id});
            image.hearted = true;
            _this.btn.className = "btn btn-danger "+cl+" active";
          break;
        default:
          break;
      }
    });
  }
  this.btn.appendChild(this.span);

  return this.btn;
};
