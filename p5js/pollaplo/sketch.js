/*** ALL SENSOR VALUES ***/
var latLowVal = 50.84; // lowest latitude value (2nd column)
var latHighVal = 50.855; // highest
var lonLowVal = 4.31; // lowest longitude value (3rd column)
var lonHighVal = 4.35; // highest

var sensor1Name = "dust"; // which column (starting at 0) is your sensor data in
var sensor1LowVal = 0.0; // lowest sensor value
var sensor1HighVal = 700; // highest sensor value

var sensor2Name = "accel"; // which column (starting at 0) is your sensor data in
var sensor2LowVal = 0.0; // lowest sensor value
var sensor2HighVal = 0.5; // highest sensor value

var sensor3Name = "temp"; // which column (starting at 0) is your sensor data in
var sensor3LowVal = 18; // lowest sensor value
var sensor3HighVal = 28; // highest sensor value
var tempHistory = [];

var sensor4Name = "humidity"; // which column (starting at 0) is your sensor data in
var sensor4LowVal = 18; // lowest sensor value
var sensor4HighVal = 28; // highest sensor value
var humHistory = [];

var thisLat, thisLon, thisDust, thisAccel, thisTemp, thisHum; // will hold current values of each step
var mappedLat, mappedLon, mappedDust, mappedAccel, mappedTemp, mappedHum; // will hold mapped values

var totalDataPoints; // will hold the total count after we load the .txt file

/*** ALL OTHER VARIABLES ***/
var table; // will hold our .txt file data
var bg; // will hold the background image

var currentStep = 0; // which step are we at in your map / data
var lastStep = 0; // when did we take the last step in milliseconds
var stepSpeed = 0.01; // how long to wait before taking the next step

var bgChangeStepInterval; // how many steps to wait between background changes

var SHOW_HUMIDITY, SHOW_TEMPERATURE; //toggle humidity / temperature data (true or false)

var bgImageNames = [ // all of your bg image files to use
  "DSC_1692_1200.JPG",
  "DSC_1705_1200.JPG",
  "DSC_1714_1200.JPG",
  "DSC_1715_1200.jpg",
  "DSC_1745_1200.JPG",
  "DSC_1751_1200.JPG",
  "DSC_1809_1200.JPG",
  "DSC_3935_1200.JPG",
  "DSC_4006_1200.JPG",
  "DSC_4047_1200.JPG"
]

function preload() {
  //example: top,lat,lon,humidity,temp,accel,dust
  //$data,50.841350,4.322436,44.10,24.70,0.05,204
  table = loadTable("data/GPSALEX2.txt", "csv", "header");
}

function setup() {

  createCanvas(1200, 800);
  bg = loadImage("images/" + bgImageNames[0]);

  // count the columns
  print(table.getRowCount() + " total rows in table");
  print(table.getColumnCount() + " total columns in table");

  // save this for using later!
  totalDataPoints = table.getRowCount();

  // calculate how many steps to wait before changing the background:
  // interval = (totalNumberOfDataPoints / totalNumberOfImages)
  bgChangeStepInterval = parseInt(totalDataPoints / bgImageNames.length);
  print("bgChangeStepInterval = " + bgChangeStepInterval);

  drawButtons(); // buttons to control line graphs
}

function draw() {

  // draw the background
  image(bg, 0, 0, bg.width, bg.height);

  // start at 0 and go through all data until current step
  for (var dLine = 0; dLine < currentStep; dLine++) {
    thisLat = parseFloat(table.getString(dLine, 1));
    thisLon = parseFloat(table.getString(dLine, 2));
    thisDust = parseFloat(table.getString(dLine, sensor1Name));
    thisAccel = parseFloat(table.getString(dLine, sensor2Name));
    thisTemp = parseFloat(table.getString(dLine, sensor3Name));
    thisHum = parseFloat(table.getString(dLine, sensor4Name));

    mappedLat = map(thisLat, latLowVal, latHighVal, 0, width);
    mappedLon = map(thisLon, lonLowVal, lonHighVal, 0, height);
    mappedDust = map(thisDust, sensor1LowVal, sensor1HighVal, 0, 255);
    mappedAccel = map(thisAccel, sensor2LowVal, sensor2HighVal, 0, 30);
    mappedTemp = map(thisTemp, sensor3LowVal, sensor3HighVal, height, height / 2);
    mappedHum = map(thisHum, sensor4LowVal, sensor4HighVal, height, height / 2);

    // draw "watercolor" of accel behind
    fill(200, 0, 200, 40);
    noStroke();
    ellipse(mappedLat, mappedLon, mappedAccel, mappedAccel);

    // draw datapoint
    fill(255 - mappedDust, 255, 255 - mappedDust);
    stroke(55); //color of the outline
    strokeWeight(1); //thickness of the outline
    ellipse(mappedLat, mappedLon, 20, 20); //x, y, width, height;
  }

  tempHistory.push(mappedTemp);
  humHistory.push(mappedHum);
  drawLineGraph();

  if (millis() - lastStep > stepSpeed) { // if the time past since our last update is > than stepSpeed
    lastStep = millis(); // reset the timer
    currentStep++; // increase the current step

    if (currentStep % bgChangeStepInterval == 0) // if we're at a background change step
      updateBackground(); // update the background image

    if (currentStep > totalDataPoints) { // if we reached all of the rows (all data lines)
      currentStep = 0; // then reset to 0
      tempHistory = [];
      humHistory = [];
    }
  }

  drawData(); // draws the data info box
  drawTitle(); // title of map

}


//this function updates the background file!
function updateBackground() {
  var whichBackgroundIndex = (currentStep / bgChangeStepInterval) - 1;
  // print("whichBackgroundIndex: "+whichBackgroundIndex);
  bg = loadImage("images/" + bgImageNames[whichBackgroundIndex]);
}


function drawLineGraph() {
  /*** humidity line graph ***/
  if (SHOW_HUMIDITY) {
    if (humHistory.length > 1) {
      stroke(120, 120, 255, 70);
      strokeWeight(3);
      for (var i = 1; i < humHistory.length; i++) {
        //draw the temperature history line
        line(width / totalDataPoints * (i - 1), humHistory[i - 1],
          width / totalDataPoints * i, humHistory[i]);
      }
      var thisX = width / totalDataPoints * (humHistory.length - 1);
      var thisY = humHistory[humHistory.length - 1];

      fill(0, 140);
      noStroke();
      rect(thisX + 18, thisY - 40, 90, 40); //black box behind %rH

      fill(120, 120, 255, 250);
      stroke(255, 0);
      strokeWeight(2);
      textSize(20);
      text(thisHum + "%rH", thisX + 25, thisY - 10); //draw %rH
    }
  }

  /*** temperature line graph **/
  if (SHOW_TEMPERATURE) {
    if (tempHistory.length > 1) {
      stroke(255, 70);
      strokeWeight(2);
      for (var i = 1; i < tempHistory.length; i++) {
        //draw the temperature history line
        line(width / totalDataPoints * (i - 1), tempHistory[i - 1],
          width / totalDataPoints * i, tempHistory[i]);
      }
      var thisX = width / totalDataPoints * (tempHistory.length - 1);
      var thisY = tempHistory[tempHistory.length - 1];

      fill(0, 140);
      noStroke();
      rect(thisX - 50, thisY - 15, 84, 36); //black box behind temp


      fill(0, 100);
      rect()
      fill(255, 250);
      textSize(20);
      text(thisTemp + "°C", thisX - 40, thisY + 10);
    }
  }
}


function drawTitle() {
  fill(20, 180);
  noStroke();
  rect(0, 0, width, 70);
  fill(255); //draw in white now
  textSize(50); //text size
  text("POLLAPLO", 20, 50); //text ("text", x, y)
}

function drawData() {
  fill(20, 180);
  noStroke();
  rect(width - 200, height - 85, 300, 100);
  fill(255);
  textSize(14);
  text("dust:\t" + thisDust, width - 180, height - 65);
  text("accel:\t" + thisAccel, width - 180, height - 45);
  text("latitude:\t" + thisLat, width - 180, height - 25);
  text("longitude:\t" + thisLon, width - 180, height - 5);
}

function drawButtons() {
  var tempButton, humButton;

  tempButton = createButton(SHOW_TEMPERATURE ? 'hide temperature' : 'show temperature');
  tempButton.position(width - 150, 25);
  tempButton.mousePressed(function() {
    SHOW_TEMPERATURE = !SHOW_TEMPERATURE;
    drawButtons();
  });

  humButton = createButton(SHOW_HUMIDITY ? 'hide humidity' : 'show humidity');
  humButton.position(width - 270, 25);
  humButton.mousePressed(function() {
    SHOW_HUMIDITY = !SHOW_HUMIDITY;
    drawButtons();
  });
}