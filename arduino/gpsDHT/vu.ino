#include <Adafruit_NeoPixel.h>
#define PIN 6
#define numLeds 8
int currentLedLevel = 0;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(numLeds, PIN, NEO_GRB + NEO_KHZ800);

// my colors
const uint32_t green = strip.Color(0, 255, 0);
const uint32_t yellow = strip.Color(127, 127, 0);
const uint32_t orange = strip.Color(237, 90, 0);
const uint32_t red = strip.Color(255, 0, 0);
const uint32_t off = strip.Color(0, 0, 0);

#define NOISE_SAMPLES 20
int noiseCounter = 0;
int runningNoise[NOISE_SAMPLES];


// microphone stuff
#define micPin A0
#define micHighVal 1.6
#define micLowVal 0.4
#define sampleWindow 50 // Sample window width in mS (50 mS = 20Hz)
unsigned int sample;


void vuSetup() {
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

float getNoiseAvg(){
  float avg = 0;
  for(int i=0; i<NOISE_SAMPLES; i++){
    avg+=runningNoise[i]; 
  }
  avg /= NOISE_SAMPLES;
  return avg;
}


void vuUpdate() {

  readMicrophone();
  
  for(int i=0; i<currentLedLevel; i=i+1){
    if(i <= 1){
      strip.setPixelColor(i, green);
    } else if (i > 1 && i <= 3){
      strip.setPixelColor(i, yellow);
    } else if (i > 3 && i <= 5){
      strip.setPixelColor(i, orange);
    } else if (i > 5 && i <= 7){
      strip.setPixelColor(i, red);
    }
  }

  if(currentLedLevel < numLeds){
    for(int i=numLeds; i>currentLedLevel; i--){
      strip.setPixelColor(i, off);
    }
  }
  strip.show();

  //  colorWipe(strip.Color(255, 0, 0), 50); // Red
  //  colorWipe(strip.Color(0, 255, 0), 50); // Green
  //  colorWipe(strip.Color(0, 0, 255), 50); // Blue
  //  theaterChase(strip.Color(127, 127, 127), 50); // White
  //  theaterChase(strip.Color(127, 0, 0), 50); // Red
  //  theaterChase(strip.Color(0, 0, 127), 50); // Blue
  //  rainbow(20);
  //  rainbowCycle(20);
  //  theaterChaseRainbow(50);
}

void readMicrophone() {

  unsigned long startMillis = millis(); // Start of sample window
  int peakToPeak = 0;   // peak-to-peak level

  int signalMax = 0;
  int signalMin = 1024;

  // collect data for 50 mS
  while (millis() - startMillis < sampleWindow)
  {
    sample = analogRead(micPin);
    if (sample < 1024)  // toss out spurious readings
    {
      if (sample > signalMax)
      {
        signalMax = sample;  // save just the max levels
      }
      else if (sample < signalMin)
      {
        signalMin = sample;  // save just the min levels
      }
    }
  }
  peakToPeak = signalMax - signalMin;  // max - min = peak-peak amplitude
  float volts = (peakToPeak * 3.3) / 1024;  // convert to volts

  float level = mapF(volts, micLowVal, micHighVal, 0, 8);
  currentLedLevel = (int) level;
//  Serial.print("currentLedLevel: ");
//  Serial.print(currentLedLevel);
//  Serial.print("   volts: ");
//  Serial.println(volts);
  runningNoise[noiseCounter] = volts;
  noiseCounter++;
  if(noiseCounter>NOISE_SAMPLES)
    noiseCounter =0;
}


float mapF(float x, float in_min, float in_max, int out_min, int out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


