
// neopixel stuff
#include <Adafruit_NeoPixel.h>
#define PIN 6
int numLeds = 8;
int currentLedLevel = 0;
Adafruit_NeoPixel strip = Adafruit_NeoPixel(numLeds, PIN, NEO_GRB + NEO_KHZ800);

// my colors
uint32_t green = strip.Color(0, 255, 0);
uint32_t yellow = strip.Color(127, 127, 0);
uint32_t orange = strip.Color(237, 90, 0);
uint32_t red = strip.Color(255, 0, 0);
uint32_t off = strip.Color(0, 0, 0);


// microphone stuff
int micPin = A0;
float micHighVal = 1.6;
float micLowVal = 0.4;
const int sampleWindow = 50; // Sample window width in mS (50 mS = 20Hz)
unsigned int sample;

void setup() {
  Serial.begin(9600);
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void loop() {

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
  unsigned int peakToPeak = 0;   // peak-to-peak level

  unsigned int signalMax = 0;
  unsigned int signalMin = 1024;

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
  Serial.print("currentLedLevel: ");
  Serial.print(currentLedLevel);
  Serial.print("   volts: ");
  Serial.println(volts);
}


float mapF(float x, float in_min, float in_max, int out_min, int out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


// Fill the dots one after the other with a color
void colorWipe(uint32_t c, uint8_t wait) {
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, c);
    strip.show();
    delay(wait);
  }
}

void rainbow(uint8_t wait) {
  uint16_t i, j;

  for (j = 0; j < 256; j++) {
    for (i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel((i + j) & 255));
    }
    strip.show();
    delay(wait);
  }
}

// Slightly different, this makes the rainbow equally distributed throughout
void rainbowCycle(uint8_t wait) {
  uint16_t i, j;

  for (j = 0; j < 256 * 5; j++) { // 5 cycles of all colors on wheel
    for (i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel(((i * 256 / strip.numPixels()) + j) & 255));
    }
    strip.show();
    delay(wait);
  }
}

//Theatre-style crawling lights.
void theaterChase(uint32_t c, uint8_t wait) {
  for (int j = 0; j < 10; j++) { //do 10 cycles of chasing
    for (int q = 0; q < 3; q++) {
      for (int i = 0; i < strip.numPixels(); i = i + 3) {
        strip.setPixelColor(i + q, c);  //turn every third pixel on
      }
      strip.show();

      delay(wait);

      for (int i = 0; i < strip.numPixels(); i = i + 3) {
        strip.setPixelColor(i + q, 0);      //turn every third pixel off
      }
    }
  }
}

//Theatre-style crawling lights with rainbow effect
void theaterChaseRainbow(uint8_t wait) {
  for (int j = 0; j < 256; j++) {   // cycle all 256 colors in the wheel
    for (int q = 0; q < 3; q++) {
      for (int i = 0; i < strip.numPixels(); i = i + 3) {
        strip.setPixelColor(i + q, Wheel( (i + j) % 255)); //turn every third pixel on
      }
      strip.show();

      delay(wait);

      for (int i = 0; i < strip.numPixels(); i = i + 3) {
        strip.setPixelColor(i + q, 0);      //turn every third pixel off
      }
    }
  }
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if (WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}
